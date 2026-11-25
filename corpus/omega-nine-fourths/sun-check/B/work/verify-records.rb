# Cross-check the published JSON records without loading the reconstruction.
require 'json'
require 'digest'

def verify(test, description)
  raise "Verification failed: #{description}" unless test
end

base = __dir__
rows = JSON.parse(File.read(File.join(base, 'packets.json')))
mismatches = 0
rows.fetch('products').each do |product|
  packet = rows.fetch('rows').fetch(product.fetch('id'))
  value = product.fetch('xyz').each_with_index.reduce(1) do |prod,(col,side)|
    prod * Rational(packet.fetch('scalars_xyz')[side][col])
  end
  claimed = packet.fetch('mask').include?(product.fetch('name')) ? Rational(1,128) : 0
  verify(value*128 == product.fetch('literal_times128'), 'recorded side product')
  verify(claimed*128 == product.fetch('claimed_times128'), 'recorded mask product')
  mismatches += 1 if value != claimed
end
verify(mismatches == 50,'number of literal discrepancies')
chart = JSON.parse(File.read(File.join(base, 'charts.json'))).fetch('charts')
verify(chart.size == 256 && chart.all?{|r|r.fetch('twisted').size == 16},'chart ledger dimensions')
origin = chart.find{|r|r.fetch('rho')==0 && r.fetch('beta')==0}
verify(origin.fetch('literal') == rows.fetch('products').sum{|r|r.fetch('literal_times128')}, 'chart origin')

seed = 'X1-Sun-M32-B-v1'
fields = [1_000_003,998_244_353]
nr = 0
File.foreach(File.join(base,'points.jsonl')) do |line|
  sample = JSON.parse(line)
  p,j = sample.values_at('p','j')
  verify(p==fields.fetch(nr/20) && j==nr%20,'sample id')
  coordinates = sample.values_at('x','y','z')
  verify(coordinates.all?{|v|v.size==1024}, 'sample coordinate sizes')
  stream = Enumerator.new do |out|
    0.step do |block|
      hex = Digest::SHA256.hexdigest("#{seed}|#{p}|#{j}|#{block}")
      hex.scan(/.{8}/).each do |s|
        w = s.to_i(16)
        out << w%p if w + (2**32 % p) < 2**32
      end
    end
  end
  verify(coordinates.flatten == stream.take(3072), 'saved field coordinates')
  x,y,z = coordinates.map{|v|v.each_slice(32).to_a}
  # Contract Z with X first, independently of the X*Y contraction in audit.rb.
  result = 0
  32.times do |k|
    32.times do |j2|
      zx = 0
      32.times{|i| zx += z[k][i]*x[i][j2]}
      result += (zx%p)*y[j2][k]
    end
  end
  verify(result%p == sample.fetch('target_M32'), 'target trace')
  verify(sample.fetch('source_evaluation').nil? && sample.fetch('coefficients_compared').empty?, 'source comparison status')
  nr += 1
end
verify(nr==40,'sample count')
puts 'Verified 354 literal side products, 256 chart records and their origin, 122880 sampled coordinates, and 40 target traces.'
