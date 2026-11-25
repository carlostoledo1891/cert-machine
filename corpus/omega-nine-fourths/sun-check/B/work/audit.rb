# Run with "ruby audit.rb" from B/work. All TeX is read as inert text.
require 'digest'
require 'json'
require 'matrix'
require 'open3'
require_relative 'local'

ROOT = File.expand_path('../../../provenance/sun', __dir__)
PRIMES = [1_000_003, 998_244_353].freeze
EXPECTED = {
  'pdf-2610.13971v1.pdf' => '4ab194c99416b59a21809d78a71d089695ee62de75981635b6cb95b6e2299e96',
  'eprint-2610.13971v1.bin' => '1726d523a0d5299fa5df9e7f5909891c9c7f6ef24a18f84ff485d7158812436b',
  'eprint-v1/P102Final.tex' => '267360310577c890173eb22a50abbe205aaf1bb2b8cb2bcebf1e824924682467',
  'eprint-v1/00README.json' => '5b8ac88239f028700a99fe1dc8536c53a5a21a0a4ae85208068e25b559e64d10'
}.freeze

def require_true(condition, name)
  raise "Local verifier did not establish #{name}" unless condition
end

def write_json(file, object)
  File.write(File.join(__dir__,file), JSON.pretty_generate(object) + "\n")
end

def provenance
  EXPECTED.each do |path, expected|
    require_true(Digest::SHA256.file(File.join(ROOT, path)).hexdigest == expected, path)
  end
  archive = File.join(ROOT, 'eprint-2610.13971v1.bin')
  members, status = Open3.capture2('tar', '-tzf', archive)
  require_true(status.success? && members.lines.map(&:strip).sort == %w[00README.json P102Final.tex], 'archive inventory')
  members.lines.map(&:strip).each do |member|
    data, status = Open3.capture2('tar', '-xOzf', archive, member)
    require_true(status.success? && data.b == File.binread(File.join(ROOT, 'eprint-v1', member)), "archive #{member}")
  end
  EXPECTED
end

def image_bits(images, label)
  images.each_with_index.reduce(0) { |v, (im,i)| label[i] == 1 ? v ^ im : v }
end

def dot(a,b)
  v = a & b
  (v ^ (v >> 1) ^ (v >> 2) ^ (v >> 3)) & 1
end

def sign(a,b)
  dot(a,b) == 0 ? 1 : -1
end

def supports(q)
  result = {}
  (1..q).each do |i|
    result["A#{i}"] = [0,i,i]
    result["B#{i}"] = [i,0,i]
    result["C#{i}"] = [i,i,0]
  end
  result.merge('P'=>[0,0,q+1], 'Q'=>[0,q+1,0], 'R'=>[q+1,0,0])
end

def packet_table(lines)
  # Use only the full 32-row longtable (not the partial reprise in Appendix A).
  table = lines[1499...1542]
  rows = table.map.with_index do |line, offset|
    match = line.match(/\A(\d+)&(\d+)&(\d+)&(\d+)&\$\\CW_(\d+)\$&(.+?)\\\\\s*\z/)
    next unless match
    id,l,s,c,q = match.captures.first(5).map(&:to_i)
    mask = match[6] == '--' ? [] : match[6].delete('$_').split(',')
    {id:id, layer:l, state:s, chi:c, q:q, mask:mask, tex_line:1500+offset}
  end.compact
  require_true(rows.map{|p|p[:id]} == (0...32).to_a, 'packet table completeness')
  rows
end

def dense_scalars(q, mask)
  sat = {'000'=>[0,0,0], '100'=>[0,1,1], '010'=>[1,0,1],
         '001'=>[1,1,0], '111'=>[1,1,1]}
  triples = [[Rational(1,128),1,1]]
  (1..q).each do |i|
    key = %w[A B C].map{|name| mask.include?("#{name}#{i}") ? '1' : '0'}.join
    triples << sat.fetch(key)
  end
  triples << [mask.include?('R') ? Rational(1,128) : 0, mask.include?('Q') ? 1 : 0, mask.include?('P') ? 1 : 0]
  triples.transpose
end

B = [[9,4,8,6],[8,6,4,9]].freeze
THETA = %w[A1 A2 A3 B1 B2 B3 C1 C2 C3 P Q R].zip([3,0,0,5,9,0,6,9,0,10,12,15]).to_h.freeze
COLOR_TWISTS = [[0,5,9,0,15],[0,3,0,0,12],[0,0,0,0,10]].freeze

def packet_checks(rows)
  tests = []
  twist_checks = supports(3).count { |m,cols| cols.each_with_index.reduce(0){|v,(c,s)| v ^ COLOR_TWISTS[s][c]} == THETA.fetch(m) }
  rows.each do |p|
    layer,s,q = p.values_at(:layer,:state,:q)
    c = image_bits([[2,5,10,1],[10,1,5,2]][layer],s)
    require_true(c == p[:chi] && (image_bits([2,5,8,16],s) ^ (3*layer)) == p[:id], 'packet addressing')
    expected_mask = if layer == 0
      [6,7,10,11].include?(c) ? %w[C1] : []
    elsif [6,10].include?(c)
      %w[A1 B1 B2 C1 P Q R]
    elsif [7,11].include?(c)
      %w[A1 A2 B1 C1 P Q R]
    else
      %w[A1 A3 B1 B2 C1 P Q R]
    end
    require_true(expected_mask == p[:mask], 'packet mask vs layer rule')
    factors = dense_scalars(q,p[:mask])
    p[:scalars_xyz] = factors.map{|side|side.map{|n|Rational(n).to_s}}
    supports(q).each do |name,colors|
      weight128 = 128 * colors.each_with_index.reduce(1){|v,(col,i)|v * factors[i][col]}
      require_true(weight128.denominator == 1, 'denominator divides 128')
      expected128 = p[:mask].include?(name) ? 1 : 0
      tests << {id:p[:id], name:name, xyz:colors, literal_times128:weight128.to_i, claimed_times128:expected128}
    end
  end
  write_json('packets.json', {color_index:'0, satellites 1..q, infinity=q+1', rows:rows, products:tests})
  # Compute literal and asserted Walsh functions separately, always scaled by 128.
  buckets = Hash.new { |h,k| h[k] = [] }
  records = tests.select{|rec|rec[:claimed_times128] == 1}
  records.each do |rec|
    p = rows.fetch(rec[:id])
    bt_chi = B[p[:layer]].each_with_index.sum{|v,i|dot(p[:chi],v)<<i}
    buckets[p[:chi]] << (bt_chi ^ THETA.fetch(rec[:name]))
  end
  require_true((0...16).all?{|chi|buckets[chi].sort == (0...16).select{|eta|dot(eta,15)==dot(chi,3)}},'Walsh buckets')
  charts = []
  fibres = Hash.new{|h,k|h[k]=[]}
  (0...16).each do |rho|
    (0...16).each do |beta|
      lhs_literal = 0
      lhs_claimed = 0
      records.each do |rec|
        p = rows.fetch(rec[:id])
        phase = sign(p[:chi],rho ^ image_bits(B[p[:layer]],beta)) * sign(THETA.fetch(rec[:name]),beta)
        lhs_literal += phase * rec[:literal_times128]
        lhs_claimed += phase
      end
      b0,b1 = B.map{|mat|image_bits(mat,beta)}
      rhs = rho == b0 && b0 == b1 ? 128 : 0
      # Invert Lambda's encoding of the three binary defects.
      defect3 = (0...8).find{|d|image_bits([1,2,12],d) == b0 ^ b1}
      require_true(!defect3.nil?,'chart image')
      fibres[[rho ^ b0,defect3]] << [rho,beta]
      twisted = (0...16).map do |phi|
        twist = sign(phi,beta)
        literal = records.sum do |rec|
          p = rows.fetch(rec[:id])
          s = sign(p[:chi],rho ^ image_bits(B[p[:layer]],beta)) * sign(THETA.fetch(rec[:name]) ^ phi,beta)
          s * rec[:literal_times128]
        end
        unit = records.sum do |rec|
          p = rows.fetch(rec[:id])
          sign(p[:chi],rho ^ image_bits(B[p[:layer]],beta)) * sign(THETA.fetch(rec[:name]) ^ phi,beta)
        end
        [literal,unit,twist*rhs]
      end
      charts << {rho:rho,beta:beta,literal:lhs_literal,uniform:lhs_claimed,rhs:rhs,twisted:twisted}
    end
  end
  require_true(fibres.size==128 && fibres.values.all?{|v|v.size==2},'chart representatives')
  write_json('charts.json',{scale:128,twisted_order:'phi=0..15, [literal, uniform, RHS]',charts:charts})
  mismatches = tests.reject{|v|v[:literal_times128] == v[:claimed_times128]}
  {types: rows.group_by{|p|p[:q]}.transform_values(&:size),
   raw:tests.size, retained:records.size, omitted:tests.size-records.size,
   nonzero_pattern_matches:tests.count{|v|(v[:literal_times128]!=0)==(v[:claimed_times128]!=0)},
   literal_mismatches:mismatches.size, mismatches_by_support:mismatches.group_by{|v|v[:name]}.transform_values(&:size),
   first_mismatch:mismatches.first, twist_checks:twist_checks, bucket_entries:buckets.values.map(&:size).sum,
   chart_comparisons:charts.size, literal_chart_passes:charts.count{|v|v[:literal]==v[:rhs]},
   uniform_chart_passes:charts.count{|v|v[:uniform]==v[:rhs]},
   origin_times128:charts.first.values_at(:literal,:uniform,:rhs),
   twisted_literal_passes:charts.sum{|v|v[:twisted].count{|l,u,r|l==r}},
   twisted_uniform_passes:charts.sum{|v|v[:twisted].count{|l,u,r|u==r}},
   fibre_count:fibres.size, reps_per_fibre:2, zero_reps:fibres[[0,0]]}
end

def orbit_checks
  labels = (0...64).map{|i| [i>>2, i[1], i[0]]}
  fibres = Array.new(128,0)
  sectors = Hash.new(0)
  cycles = Array.new(32**3,0)
  bars = []
  labels.each_with_index do |(q,e,a),u|
    labels.each_with_index do |(r,d,b),v|
      labels.each_with_index do |(s,f,c),w|
        defect = ((q^r^s)<<3) | ((b^a^e)<<2) | ((f^e^d)<<1) | (c^a^e^d)
        fibres[defect] += 1
        next unless defect.zero?
        flag = [u,v,w].map(&:zero?)
        sector = { [true,false,false]=>'X', [false,true,false]=>'Y', [false,false,true]=>'Z',
                   [false,false,false]=>'dense', [true,true,true]=>'cubic' }.fetch(flag)
        sectors[sector] += 1
        bars << [u,v,w] unless sector == 'dense'
        16.times do |h|
          edges = [[h,u],[h^q,v],[h^q^r,w]].map do |start,id|
            displacement,flip,bit = labels[id]
            [2*start+bit,2*(start^displacement)+(bit^flip)]
          end
          (0...3).each{|side|require_true(edges[side][1] == edges[(side+1)%3][0], 'edge closure')}
          i,j,k = edges.map(&:first)
          cycles[(i*32+j)*32+k] += 1
        end
      end
    end
  end
  completion = [[0,0,0]]
  (1...32).each do |feature|
    q,e = feature & 15, feature >> 4
    l0,le = (q<<2)|(e<<1), (q<<2)|(e<<1)|e
    completion.concat([[0,l0,le],[le,0,l0],[l0,le,0]])
  end
  require_true(bars.sort == completion.sort, 'printed one-bar equations')
  require_true(fibres.uniq == [2048] && cycles.uniq == [1], 'terminal incidence')
  {binary_triples:fibres.sum, fibres:fibres.size, fibre_size:2048, sectors:sectors,
   rows:16, cycles:cycles.size, multiplicities:cycles.uniq}
end

def row_weyl
  h4 = (0...16).to_a
  rows = [[2,4,8,3],[4,8,3,6],[7,14,15,13]]
  ranks = (0...8).map do |mask|
    m = (0...4).map{|j|image_bits(rows.map{|im|im[j]},mask)}
    output = h4.map{|h| image_bits(m,h)}
    h4.product(h4).each do |sigma,eta|
      total = h4.sum{|h|sign(sigma,h)*sign(eta,output[h])}
      selected = m.each_with_index.sum{|v,i|dot(eta,v)<<i}
      require_true(total == (sigma==selected ? 16 : 0), 'row selector')
    end
    output.uniq.size.bit_length-1
  end
  # W_{a,q} sends e_v to sign(a,v)e_{v xor q}; compare each column.
  h4.product(h4,h4,h4).each do |alpha,q,beta,r|
    gamma = alpha ^ beta
    l = dot(alpha,q)^dot(beta,r)^dot(beta,q^r)^dot(gamma,q^r)
    require_true(l == dot(gamma,r),'phase')
    gram = 0
    h4.each do |v|
      lhs_row = (v ^ r) ^ q
      require_true(lhs_row == v ^ (q^r) && sign(beta,v)*sign(alpha,v^r) == sign(alpha,r)*sign(gamma,v),'Weyl product')
      gram += sign(alpha,v)*sign(beta,v) if (v^q) == (v^r)
    end
    require_true(gram == (alpha==beta && q==r ? 16 : 0),'Gram')
  end
  h4.product(h4).each do |h,v|
    require_true(h4.sum{|a|sign(a,h)*sign(a,v)} == (h==v ? 16 : 0),'diagonal projector')
  end
  {partial_ranks_empty_first:ranks, row_selector_identities:8*256, phase_identities:16**4,
   weyl_product_identities:16**4, gram_identities:16**4, diagonal_projector_diagonal_entries:256}
end

def field_value(q,p)
  q = Rational(q)
  q.numerator * q.denominator.pow(p-2,p) % p
end

def samples
  seed = 'X1-Sun-M32-B-v1'
  File.open(File.join(__dir__,'points.jsonl'),'w') do |io|
    PRIMES.each do |p|
      20.times do |j|
        words = []
        block = 0
        while words.size < 3072
          hash = Digest::SHA256.digest([seed,p,j,block].join('|')).unpack('N8')
          limit = (2**32 / p) * p
          words.concat(hash.select{|w|w < limit}.map{|w|w%p})
          block += 1
        end
        x,y,z = words.first(3072).each_slice(1024).to_a
        m = (0...32).sum do |i|
          (0...32).sum{|k|(0...32).sum{|j2|x[32*i+j2]*y[32*j2+k]} * z[32*k+i]}
        end % p
        io.puts JSON.generate(p:p, j:j, x:x, y:y, z:z, target_M32:m,
                              source_evaluation:nil, coefficients_compared:[])
      end
    end
  end
  {seed:seed,points_per_prime:20,source_evaluations:0,global_coefficient_comparisons:0}
end
if __FILE__ == $PROGRAM_NAME
  prov = provenance
  lines = File.readlines(File.join(ROOT,'eprint-v1/P102Final.tex'))
  rows = packet_table(lines)
  dense = packet_checks(rows)
  local = local_checks(rows,lines)
  report = {inputs:prov, dense:dense, local:local, orbit:orbit_checks, globalization_identities:row_weyl}
  report[:local_residues] = PRIMES.map do |p|
    {p:p, B1_literal:1, B1_uniform:field_value(Rational(1,128),p),
     chart_origin_literal:field_value(Rational(dense[:origin_times128][0],128),p), chart_origin_rhs:1}
  end
  report[:points] = samples
  require_true(dense[:literal_mismatches] > 0 && dense[:literal_chart_passes] < dense[:chart_comparisons], 'documented normalization blocker')
  report[:verdict] = 'NEEDS DATA'
  write_json('checks.json',report)
  puts report[:verdict]
  puts JSON.pretty_generate(report.reject{|k,v| k==:inputs})
end
