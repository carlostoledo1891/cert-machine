# Finite symbolic expansions. A side factor is a list of [degree, variable, weight].
# A rank-one product has three side factors. Monomials are keyed by [degree,x,y,z].
def single(variable, degree=0, weight=1)
  [[degree,variable,weight]]
end

def expand(products)
  result = Hash.new(0)
  products.each do |x,y,z|
    x.each do |dx,vx,wx|
      y.each do |dy,vy,wy|
        z.each{|dz,vz,wz|result[[dx+dy+dz,vx,vy,vz]] += wx*wy*wz}
      end
    end
  end
  result.reject{|_,v|v==0}
end

def degree_terms(poly)
  poly.keys.group_by(&:first).transform_values(&:size).sort.to_h
end

def tensor_of_maps(q, maps)
  supports(q).values.map{|cols| cols.each_with_index.map{|col,side|maps[side][col]}}
end

def scale_first(term,scale)
  [term.first.map{|d,v,w|[d,v,w*scale]}, *term.drop(1)]
end

def source_families
  src = {}
  checks = {}
  [2,3].each do |q|
    products = (1..q).map do |i|
      %w[x y z].map{|v|single(v+'0')+single(v+i.to_s,1)}
    end
    aggregate, high, weight, slope, last = if q==2
      [2,4,Rational(1,4),Rational(2,3),Rational(-9,4)]
    else
      [1,1,1,Rational(1,2),-4]
    end
    middle = %w[x y z].map do |v|
      single(v+'0') + (1..q).map{|i|[1,v+i.to_s,aggregate]} + single(v+'Inf',2,high)
    end
    final = %w[x y z].map{|v|single(v+'0')+(1..q).map{|i|[1,v+i.to_s,slope]}}
    products << scale_first(middle,weight) << scale_first(final,last)
    poly = expand(products)
    target = supports(q).values.map do |cols|
      [2]+cols.each_with_index.map{|col,s|%w[x y z][s]+(col==q+1 ? 'Inf' : col.to_s)}
    end
    require_true(poly.select{|k,v|k.first<=2} == target.map{|k|[k,1]}.to_h, "CW#{q} source jets")
    src["CW#{q}"] = products
    checks["CW#{q}"] = {products:products.size, terms_by_s_degree:degree_terms(poly)}
  end
  first = %w[x y z].map{|v|single(v+'0')+single(v+'Inf',1)}
  second = %w[x y z].map{|v|single(v+'0')}
  w = [first,scale_first(second,-1)]
  leading = (0...3).map{|i|[1]+%w[x y z].each_with_index.map{|leg,j|leg+(i==j ? 'Inf' : '0')}}
  wp = expand(w)
  require_true(wp.select{|k,_|k[0]<=1}==leading.map{|k|[k,1]}.to_h,'W source jet')
  src['W']=w
  checks['W']={products:w.size,terms_by_s_degree:degree_terms(wp)}
  [src,checks]
end

def active
  r = [
    [single('x1',1,-1)+single('x2'), single('y1',-1,-1), single('z0')],
    [single('x2'), single('y1',-1)+single('y2'), single('z0')+single('z1',1)],
    [single('x3'),single('y3'),single('z0')],
    [single('x4'),single('y4'),single('z0')+single('z2')]
  ]
  poly = expand(r)
  lead = (1..4).map{|i|[0,"x#{i}","y#{i}",'z0']} +
    [[0,'x2','y1','z1'],[0,'x4','y4','z2']]
  required = (lead + [[1,'x2','y2','z1']]).map{|k|[k,1]}.to_h
  require_true(poly==required,'active polynomial incl. residual')
  triples = lead.map{|_,*cols|cols}
  ranks = (0...3).map do |side|
    vs = triples.map{|t|t[side]}.uniq
    complement = (0...3).to_a - [side]
    pairs = triples.map{|t|t.values_at(*complement)}.uniq
    Matrix.build(vs.size,pairs.size){|i,j|triples.count{|t|t[side]==vs[i] && t.values_at(*complement)==pairs[j]}}.rank
  end
  m0 = Matrix[[1,1,1,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]]
  unit = ->(i,j){Matrix.build(4){|a,b|a==i && b==j ? 1 : 0}}
  m1,m2 = unit.call(0,0), unit.call(3,3)
  a = m0+m2
  swap = Matrix[[1,0,0,0],[0,0,1,0],[0,1,0,0],[0,0,0,1]]
  l = a * swap
  require_true(l*swap.transpose==a && l*unit.call(1,0)*swap.transpose==m1 && l*m2*swap.transpose==m2,'active slice basis change')
  require_true(a.determinant == -1 && a.inverse*m1 == unit.call(2,0) && a.inverse*m2==m2,'active inverse')
  # Columns lift the canonical coordinates into the effective original bases.
  lift = {X:l.to_a,Y:swap.to_a,Z:[[1,0,-1],[0,1,0],[0,0,1]]}
  [r,lift,{products:4,terms_by_t_degree:degree_terms(poly),flattenings:ranks,determinant:a.determinant}]
end

def rational_token(token)
  s = token.strip
  return s.to_i if s =~ /\A-?\d+\z/
  m = s.match(/\A(-?)\\t?frac(\d)(\d)\z/) or raise "Unread rational token #{s.inspect}"
  Rational(m[1]=='-' ? -m[2].to_i : m[2].to_i,m[3].to_i)
end

def matrix_lines(lines,start,count)
  Matrix.rows(lines.slice(start-1,count).map do |line|
    line.strip.sub(/\\\\\z/,'').split('&').map{|token|rational_token(token)}
  end)
end

def five_empty(lines)
  b,d = matrix_lines(lines,1806,7), matrix_lines(lines,1818,7)
  c = Matrix[[1,0,0,0,0,Rational(1,2),0,0,0,Rational(-1,2)]]
  jmat = Matrix.build(10){|i,j|(i-j).abs==5 ? 1 : 0}
  require_true(c*jmat*c.transpose==Matrix[[1]] && b*jmat*d.transpose==Matrix.identity(7) &&
    [b,d].all?{|m|m*jmat*c.transpose==Matrix.zero(7,1)},'five-empty pairings')
  require_true([b,d,c].all?{|m|m.row_vectors.all?{|row|row.to_a.last(5).sum.zero?}},'last-five sums')
  all_maps = (0...5).map do |j|
    maps = Array.new(3){Array.new(5){[]}}
    [0,4].each_with_index do |color,half|
      col = j+5*half
      x,y,z = (0...3).map{|s|maps[s][color]}
      if color==0
        x.concat(single('barX',-2))
        y.concat(single('barY',-2))
        z.concat(single('barZ',-2))
      end
      7.times do |a|
        x.concat(single("P#{a+1}",1,b[a,col])) unless b[a,col]==0
        y.concat(single("Q#{a+1}",1,d[a,col])) unless d[a,col]==0
      end
      if c[0,col] != 0
        y.concat(single('U',1,c[0,col]))
        z.concat(single('V',1,c[0,col]))
      end
      z.concat(single('barZ',4)) if j==0 && color==4
    end
    (1..3).each do |i|
      %w[X Y Z].each_with_index{|v,s|maps[s][i] = single("#{v}shared#{3*j+i}",1)}
    end
    maps
  end
  terms = all_maps.flat_map{|m|tensor_of_maps(3,m)}
  poly = expand(terms)
  target = [[0,'barX','barY','barZ'],[0,'barX','U','V']]
  (1..15).each do |i|
    %w[X Y Z].each_index{|s|target << [0]+%w[X Y Z].each_with_index.map{|v,j|s==j ? "bar#{v}" : "#{v}shared#{i}"}}
  end
  (1..7).each{|a|target<<[0,"P#{a}","Q#{a}",'barZ']}
  require_true(poly.select{|k,_|k.first<=0}==target.map{|k|[k,1]}.to_h,'five-empty local Laurent expansion')
  [all_maps,{CW_supports:terms.size, terms_by_t_degree:degree_terms(poly),endpoints:[16,15,22],cubic:1,
             pairings:['1','I7','0','0'],last_five_zero_sums:15}]
end

def exceptional(rows,lines)
  # [chi, barred side index, packets in printed order, b line, E_L/E_R start, r].
  blocks = [[6,0,[23,30],4407,4426,4431,3], [7,0,[7,27],4408,4439,4445,4],
            [10,1,[8,1],4409,4454,4459,3], [11,1,[24,4],4410,4467,4473,4]]
  data = []
  blocks.each do |chi,bar,ids,bc,lstart,rstart,rank|
    barr = lines.fetch(bc-1).match(/=\(([^)]+)\)/)[1].split(',').map{|s|Integer(s)}
    el,er = matrix_lines(lines,lstart,rank), matrix_lines(lines,rstart,rank)
    n = barr.size
    kk = Array.new(n){Array.new(n,0)}
    side_l,side_r = (0...3).to_a - [bar]
    dense_l,dense_r = [],[]
    colors_l,colors_r = [],[]
    pos = 0
    occurrences = 0
    ids.each do |id|
      row = rows.fetch(id)
      q = row[:q]
      factors = dense_scalars(q,row[:mask])
      dense_l.concat(factors[side_l])
      dense_r.concat(factors[side_r])
      cols = (0..q).to_a + [4] # Last semantic colour is infinity even when q=2.
      colors_l.concat(COLOR_TWISTS[side_l].values_at(*cols))
      colors_r.concat(COLOR_TWISTS[side_r].values_at(*cols))
      supports(q).each_value do |cols|
        kk[pos+cols[side_l]][pos+cols[side_r]] += barr[pos+cols[bar]]
        occurrences += 1
      end
      pos += q+2
    end
    k = Matrix.rows(kk)
    dl,dr = Matrix[dense_l],Matrix[dense_r]
    # Refine the all-ones diagnostic by the printed side-colour twists alone.
    # This is an intermediate colour space before packet/row transports.
    by_twist = ->(weights,colors){
      Matrix.build(16,weights.size){|twist,col|colors[col]==twist ? weights[col] : 0}
    }
    cl,cr = by_twist.call(dense_l,colors_l),by_twist.call(dense_r,colors_r)
    require_true(pos==n, 'exceptional column order')
    ee = el*k*er.transpose
    data << {chi:chi,packets:ids,occurrences:occurrences,b:barr,K:k.to_a,E_L:el.to_a,E_R:er.to_a,
             E_ranks:[el.rank,er.rank], E_K_Et:ee.to_a, E_K_Et_identity:ee==Matrix.identity(rank),
             color_twist_diagnostic:{clean_dimensions:[n-(k*cr.transpose).rank,n-(cl*k).rank],
               zero_tests:[cl*k*cr.transpose,el*k*cr.transpose,cl*k*er.transpose].map{|m|m.to_a.flatten.all?(&:zero?)}},
             all_ones_dense_specialization:{
               D_L:dl.to_a, D_R:dr.to_a, D_K_Dt:(dl*k*dr.transpose).to_a,
               E_K_Dt:(el*k*dr.transpose).to_a, D_K_Et:(dl*k*er.transpose).to_a}}
  end
  data
end

def partition(rows)
  empty = [0,18,21,26,31]
  pairs = [[16,6],[15,25],[2,19],[29,12],[5,11],[10,17],[13,9]]
  active = [3,14,20,22,28]
  exceptional = [23,30,7,27,8,1,24,4]
  used = empty + pairs.flatten + active + exceptional
  require_true(used.sort==(0...32).to_a,'packet partition')
  punctures = pairs.map(&:first)
  require_true(punctures.all?{|id|rows[id][:layer]==0 && rows[id][:mask].empty?},'puncture masks')
  repaired = rows.map do |row|
    id = row[:id]
    punctures.include?(id) ? 'W' : (active.include?(id) ? 'D4' : "CW#{row[:q]}")
  end
  costs = {'CW3'=>5,'CW2'=>4,'W'=>2,'D4'=>4}
  restored = repaired.each_with_index.map{|type,id|active.include?(id) ? 'CW3' : type}
  pools = [
    [(1..15).to_a,[16,17],(18..23).to_a,(24..30).to_a,[31]],
    [(1..15).to_a,(16..18).to_a,(19..24).to_a,(25..31).to_a,[]],
    [(1..15).to_a,[],(16..24).to_a,[],(25..31).to_a]
  ]
  require_true(pools.all?{|p|p.flatten.sort==(1..31).to_a},'endpoint ranges')
  rank_directions = repaired.sum{|q|costs.fetch(q)}
  {punctures:punctures.sort, puncture_types:punctures.map{|p|rows[p][:q]}.group_by(&:itself).transform_values(&:size),
   empties:empty,pairs:pairs,active:active,exceptional:exceptional,partition_size:used.uniq.size,
   repaired:repaired.group_by(&:itself).transform_values(&:size),repaired_cost:rank_directions,
   global_cost:16*rank_directions, restored_cost:restored.sum{|q|costs[q]},
   endpoint_allocation_shared_active_tangent_exceptional_regular:pools.map{|sectors|sectors.map(&:size)}}
end

def local_checks(rows,lines)
  ranks,source_checks = source_families
  active_terms,active_lift,active_checks = active
  five_maps,five_checks = five_empty(lines)
  exc = exceptional(rows,lines)
  w_tangent = [
    [single('X0'), %w[X0 X1 X2 X3].map{|v|[0,v,1]}],
    [single('Y0'), %w[Y1 Y2].map{|v|[0,v,1]}],
    [single('Z0'), single('Z1')]
  ]
  w_poly = expand([[1,0,0],[0,1,0],[0,0,1]].map{|a|a.each_with_index.map{|i,s|w_tangent[s][i]}})
  arrow = [%w[X0 Y0 Z0],%w[X0 Y1 Z0],%w[X0 Y2 Z0],%w[X1 Y0 Z0],%w[X1 Y1 Z0],%w[X2 Y0 Z0],%w[X3 Y0 Z0],%w[X0 Y0 Z1]]
  require_true(w_poly.keys.map{|k|k.drop(1)}.sort==(arrow-[%w[X1 Y1 Z0]]).sort && w_poly.values.uniq==[1],'seven tangent W terms')
  write_json('local-maps.json',{entry_format:'A side factor lists [exponent, local variable, rational weight]. Rank terms list X,Y,Z factors. Five-empty arrays index packet, side, then source colour.',
    rank_one_source_families_in_s:ranks, active_family_in_t:active_terms,active_lift_columns:active_lift,
    five_empty_maps_in_t:five_maps, W_to_arrow:w_tangent, exceptional_generic:exc})
  {ledger:partition(rows),source_jets:source_checks,active:active_checks,five_empty:five_checks,
   tangent_W:{arrow_terms:arrow.size,terms_supplied:w_poly.size,missing:%w[X1 Y1 Z0]},
   exceptional:exc.map{|e|e.slice(:chi,:occurrences,:E_ranks,:E_K_Et_identity,:color_twist_diagnostic).merge(
     specialized_dense_zero_conditions:e[:all_ones_dense_specialization].values_at(:D_K_Dt,:E_K_Dt,:D_K_Et).map{|m|m.flatten.all?(&:zero?)})}}
end
