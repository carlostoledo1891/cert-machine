import sympy as sp
h=sp.symbols('h',positive=True); D=sp.Rational(1,2)-h; A=sp.Rational(1,2)+h
out=[]
# C3: Lemma 4.1 derivatives of the similarity coordinates. tau = q(1-eta^2), z = q^D eta, X = r^2/(2q)
q,eta,r,z,tau=sp.symbols('q eta r z tau',positive=True)
# implicit: F1 = q(1-eta^2) - tau = 0, F2 = q^D eta - z = 0 ; unknowns q,eta as functions of (z,tau)
F1=q*(1-eta**2)-tau; F2=q**D*eta-z
J=sp.Matrix([[sp.diff(F1,q),sp.diff(F1,eta)],[sp.diff(F2,q),sp.diff(F2,eta)]])
rhs_t=-sp.Matrix([sp.diff(F1,tau),sp.diff(F2,tau)]); rhs_z=-sp.Matrix([sp.diff(F1,z),sp.diff(F2,z)])
dt=J.solve(rhs_t); dz=J.solve(rhs_z)   # d/dtau (q,eta), d/dz (q,eta)
L=1-2*h*eta**2; d=1-eta**2
claims={
 'q_tau = 1/L (paper: q_t = -1/L with t=1-tau)': sp.simplify(dt[0]-1/L),
 'eta_tau = -D eta/(qL)': sp.simplify(dt[1]+D*eta/(q*L)),
 'q_z = 2 eta q^{1-D}/L': sp.simplify(dz[0]-2*eta*q**(1-D)/L),
 'eta_z = d/(q^D L)': sp.simplify(dz[1]-d/(q**D*L)),
 'L - 2 D eta^2 = d': sp.simplify(L-2*D*eta**2-d),
}
X=r**2/(2*q)
claims['X_tau = -X/(qL) (paper X_t = X/(qL))']=sp.simplify(sp.diff(X,q)*dt[0]+X/(q*L))
claims['X_z = -2 eta X/(q^D L)']=sp.simplify(sp.diff(X,q)*dz[0]+2*eta*X/(q**D*L))
for k,v in claims.items(): out.append(('C3',k,v==0,v))
# C4: commutator kernel norm in R^3: int (|x|^-3 min(|x|/R,1))^{4/3} dx = 16 pi / R
R,s=sp.symbols('R s',positive=True)
I=4*sp.pi*(sp.integrate((s**-3*s/R)**sp.Rational(4,3)*s**2,(s,0,R))+sp.integrate((s**-3)**sp.Rational(4,3)*s**2,(s,R,sp.oo)))
out.append(('C4','int K_R^{4/3} = 16 pi / R',sp.simplify(I-16*sp.pi/R)==0,sp.simplify(I)))
# C6: viscosity rescaling (10.22) and periodic lambda rescaling; generic smooth fields
nu,lam=sp.symbols('nu lambda',positive=True)
x1,x2,x3,t=sp.symbols('x1 x2 x3 t',real=True); xs=(x1,x2,x3)
U=[sp.Function(f'u{i}')(x1,x2,x3,t) for i in range(3)]; P=sp.Function('p')(x1,x2,x3,t)
def NSres(U,P,visc,coords,tt):
    return [sp.diff(U[i],tt)+sum(U[j]*sp.diff(U[i],coords[j]) for j in range(3))-visc*sum(sp.diff(U[i],c,2) for c in coords)+sp.diff(P,coords[i]) for i in range(3)]
f=NSres(U,P,1,xs,t)   # force at viscosity one := residual
# rescaled fields: u_nu(x,t) = sqrt(nu) u(x/sqrt(nu),t), p_nu = nu p(x/sqrt nu,t), f_nu = sqrt(nu) f(x/sqrt nu, t)
sub={x1:x1/sp.sqrt(nu),x2:x2/sp.sqrt(nu),x3:x3/sp.sqrt(nu)}
Un=[sp.sqrt(nu)*u.subs(sub,simultaneous=True) for u in U]; Pn=nu*P.subs(sub,simultaneous=True)
fn=[sp.sqrt(nu)*fi.subs(sub,simultaneous=True) for fi in f]
resn=NSres(Un,Pn,nu,xs,t)
ok=all(sp.simplify(sp.expand(resn[i]-fn[i]).doit())==0 for i in range(3))
out.append(('C6','(10.22): u_nu,p_nu solve NS at viscosity nu with force f_nu',ok,''))
# div preserved
ok2=sp.simplify(sum(sp.diff(Un[i],xs[i]) for i in range(3)) - (sum(sp.diff(U[i],xs[i]) for i in range(3))).subs(sub,simultaneous=True))==0
out.append(('C6','(10.22): div u_nu = (div u)(x/sqrt nu)',ok2,''))
# periodic rescaling: u~(x,t)=lam u(lam x, lam^2 (t-t0)), p~=lam^2 p, f~=lam^3 f  (viscosity nu fixed)
t0=sp.symbols('t0',real=True)
sub2={x1:lam*x1,x2:lam*x2,x3:lam*x3,t:lam**2*(t-t0)}
fnu=NSres(U,P,nu,xs,t)
Ul=[lam*u.subs(sub2,simultaneous=True) for u in U]; Pl=lam**2*P.subs(sub2,simultaneous=True)
fl=[lam**3*fi.subs(sub2,simultaneous=True) for fi in fnu]
resl=NSres(Ul,Pl,nu,xs,t)
ok3=all(sp.simplify(sp.expand(resl[i]-fl[i]).doit())==0 for i in range(3))
out.append(('C6','Cor 10.6 lambda-rescaling multiplies every term by lambda^3, viscosity unchanged',ok3,''))
# energy scaling (10.23): ||u_nu||_2^2 = nu^{5/2} ||u||_2^2  -> change of variables factor nu * nu^{3/2}
out.append(('C6','(10.23) energy factor nu * nu^{3/2} = nu^{5/2}',sp.simplify(nu*nu**sp.Rational(3,2)-nu**sp.Rational(5,2))==0,''))
# C11: exterior consistency: q^{-A} c X^{-A} H(2d/X) with X=r^2/(2q), d=1-eta^2, tau=q d -> c (r^2/2)^{-A} H(4 tau / r^2)
c=sp.symbols('c',positive=True); Hf=sp.Function('H')
lhs=q**(-A)*c*(r**2/(2*q))**(-A)*Hf(2*(1-eta**2)/(r**2/(2*q)))
rhs=c*(r**2/2)**(-A)*Hf(4*(q*(1-eta**2))/r**2)
out.append(('C11','q-dependence cancels: u_theta exterior = c (r^2/2)^{-A} H(4 tau/r^2)',sp.simplify(lhs-rhs)==0,''))
# C5: Lemma 10.3 derivative count: sup |d^m/dsigma^m [chi0(b sigma) sigma^j / j!]| <= C b^{m-j}
sig,b=sp.symbols('sigma b',positive=True); j,m=3,5
chi=sp.Function('chi0')
expr=sp.diff(chi(b*sig)*sig**j/sp.factorial(j),sig,m)
# substitute sigma = s/b (support sigma<=1/b -> s<=1): every term should scale as b^{m-j} times a bounded function of s
e2=sp.simplify(expr.subs(sig,s/b)/b**(m-j))
out.append(('C5',f'(10.12) with j={j},m={m}: expression/b^(m-j) at sigma=s/b is b-free',not e2.has(b),str(e2)[:80]))
for tag,name,ok,extra in out: print(tag,'PASS' if ok else 'FAIL',name, '' if ok else extra)
# C2: numeric spot check of (10.3) q <= 2^{1/(2D)} (tau + |z|^{1/D}) for the root q>|z|^{1/D} of q - z^2 q^{2h} = tau
import mpmath as mp
hv=mp.mpf('0.0099'); Dv=mp.mpf(1)/2-hv; C0=mp.mpf(2)**(1/(2*Dv)); worst=0
for zz in [mp.mpf('1e-6'),mp.mpf('1e-3'),mp.mpf('0.1'),mp.mpf(1)]:
    for tt in [mp.mpf('1e-8'),mp.mpf('1e-4'),mp.mpf('0.01'),mp.mpf(1)]:
        lo=zz**(1/Dv); qq=mp.findroot(lambda Q: Q - zz**2*Q**(2*hv) - tt, lo*1.000001+tt)
        ratio=qq/(C0*(tt+lo)); worst=max(worst,ratio)
print('C2 worst q/(C0(tau+|z|^{1/D})) on grid =',mp.nstr(worst,6),'(<=1 required); C0 =',mp.nstr(C0,6))

# ---- RED CONTROLS ----
reds=[]
def red(name,fired):
    print(("RED FIRED " if fired else "RED DID NOT FIRE ")+name); reds.append(fired)
# The viscosity rescaling (10.22), re-derived from scratch: the correct exponent 1/2 must pass
# the same test that the planted exponent 1/3 must fail.
if True:
    xs=sp.symbols('x1 x2 x3',real=True); tt=sp.Symbol('t',real=True); nn=sp.Symbol('nu',positive=True)
    U=[sp.Function('u%d'%i)(*xs,tt) for i in range(3)]; P=sp.Function('p')(*xs,tt)
    F=[sp.Function('f%d'%i)(*xs,tt) for i in range(3)]
    def resid(vel,pr,frc,visc,coords,time):
        out=[]
        for i in range(3):
            e=sp.diff(vel[i],time)+sum(vel[j]*sp.diff(vel[i],coords[j]) for j in range(3)) \
              - visc*sum(sp.diff(vel[i],coords[j],2) for j in range(3)) + sp.diff(pr,coords[i]) - frc[i]
            out.append(sp.expand(e))
        return out
    ys=[x/sp.sqrt(nn) for x in xs]
    def scaled(power):
        sub={xs[k]:ys[k] for k in range(3)}
        v=[nn**power*U[i].subs(sub) for i in range(3)]
        pp=nn*P.subs(sub); ff=[sp.sqrt(nn)*F[i].subs(sub) for i in range(3)]
        return v,pp,ff
    base=resid(U,P,F,1,xs,tt)
    for power,name in [(sp.Rational(1,2),'correct 1/2'),(sp.Rational(1,3),'planted 1/3')]:
        v,pp,ff=scaled(power)
        rs=resid(v,pp,ff,nn,xs,tt)
        # substitute the base equations: the correct scaling gives sqrt(nu) * base at the scaled point
        red_ok = all(sp.simplify(rs[i]-sp.sqrt(nn)*base[i].subs({xs[k]:ys[k] for k in range(3)}))==0 for i in range(3))
        if power==sp.Rational(1,2):
            red("the rescaling check itself passes at the correct exponent 1/2", red_ok)
        else:
            red("the same check rejects the planted exponent 1/3", not red_ok)
print(("ALL REDS FIRED" if all(reds) else "A RED DID NOT FIRE")+" (%d/%d)"%(sum(reds),len(reds)))
import sys as _sys; _sys.exit(0 if all(reds) else 1)
