import sympy as sp, mpmath as mp, sys
r,tau,h,Z,v,s=sp.symbols('r tau h Z v s',positive=True)
A=sp.Rational(1,2)+h
# (1) substitute H(Z)=exp(sZ): H'=sH, H''=s^2 H; the heat residual / K is a quadratic in s whose coefficients are the ODE coefficients
K=(r**2/2)**(-A)*sp.exp(s*4*tau/r**2)
heat=-sp.diff(K,tau)-(sp.diff(K,r,2)+sp.diff(K,r)/r-K/r**2)
poly=sp.Poly(sp.expand(sp.simplify(heat/K*r**2).subs(tau,Z*r**2/4)),s)
c2,c1,c0=[sp.factor(poly.coeff_monomial(s**k)) for k in (2,1,0)]
k=sp.simplify(c2/Z**2)
print("(1) heat residual = (%s) [Z^2 H'' + (%s) H' + (%s) H]"%(k,sp.simplify(c1/k),sp.simplify(c0/k)))
print("    matches (A.37):",sp.simplify(c1/k-(1+2*(1+h)*Z))==0 and sp.simplify(c0/k-h*(1+h))==0); sys.stdout.flush()
# (2) ODE operator applied to the integrand is a total v-derivative
g=sp.exp(-v)*v**h*(1+Z*v)**(-h)
L=Z**2*sp.diff(g,Z,2)+(1+2*(1+h)*Z)*sp.diff(g,Z)+h*(1+h)*g
cand=-h*(1+h)*sp.exp(-v)*v**(h+1)*(1+Z*v)**(-h-1)
diff=sp.expand(sp.powsimp(sp.expand((L-sp.diff(cand,v))/(sp.exp(-v)*v**h*(1+Z*v)**(-h-2))),force=True))
print("(2) [ODE op applied under the integral] - d/dv[-h(1+h)e^{-v}v^{1+h}(1+Zv)^{-1-h}] =",sp.simplify(diff)); sys.stdout.flush()
# numeric fallback for (2)
mp.mp.dps=20
hv,Zv=mp.mpf('0.0099'),mp.mpf('0.7')
Lf=sp.lambdify((v,Z,h),L,'mpmath'); Cf=sp.lambdify((v,Z,h),sp.diff(cand,v),'mpmath')
print("    numeric at v=1.3:",mp.nstr(Lf(mp.mpf('1.3'),Zv,hv)-Cf(mp.mpf('1.3'),Zv,hv),5)); sys.stdout.flush()
# (3) numeric ODE residual of H via differentiation under the integral sign
def Hd(Zv,hv,m):
    f=lambda vv: mp.e**(-vv)*vv**hv*(-1)**m*mp.rf(hv,m)*vv**m*(1+Zv*vv)**(-hv-m)   # d^m/dZ^m (1+Zv)^{-h}
    return mp.quad(f,[0,1,10,mp.inf])/mp.gamma(1+hv)
worst=0
for hv in [mp.mpf('0.0099'),mp.mpf('0.3')]:
    for Zv in [mp.mpf('0.01'),mp.mpf(1),mp.mpf(50)]:
        H0,H1,H2=Hd(Zv,hv,0),Hd(Zv,hv,1),Hd(Zv,hv,2)
        worst=max(worst,abs(Zv**2*H2+(1+2*(1+hv)*Zv)*H1+hv*(1+hv)*H0))
print("(3) numeric ODE residual for the integral H, worst over grid:",mp.nstr(worst,3)); sys.stdout.flush()
hv=mp.mpf('0.0099')
for m in range(4):
    val=Hd(mp.mpf(0),hv,m); claim=(-1)**m*mp.rf(hv,m)*mp.rf(1+hv,m)
    print(f"(4) H^({m})(0) = {mp.nstr(val,12)}  (A.35) claims {mp.nstr(claim,12)}  diff {mp.nstr(val-claim,3)}")

# ---- RED CONTROLS: the same tests, with the formula deliberately wrong, must reject ----
reds=[]
def red(name,fired):
    print(("RED FIRED " if fired else "RED DID NOT FIRE ")+name); reds.append(fired)
# (a) the ODE with h(1+h) replaced by h(2+h) must NOT match the heat residual
red("(A.37) with the zeroth-order coefficient h(2+h) is rejected",
    not (sp.simplify(c1/k-(1+2*(1+h)*Z))==0 and sp.simplify(c0/k-h*(2+h))==0))
# (b) an exponent A -> A+1 in the ansatz must NOT give the same ODE
K2=(r**2/2)**(-(A+1))*sp.exp(s*4*tau/r**2)
heat2=-sp.diff(K2,tau)-(sp.diff(K2,r,2)+sp.diff(K2,r)/r-K2/r**2)
poly2=sp.Poly(sp.expand(sp.simplify(heat2/K2*r**2).subs(tau,Z*r**2/4)),s)
c22,c12,c02=[sp.factor(poly2.coeff_monomial(s**kk)) for kk in (2,1,0)]
k2=sp.simplify(c22/Z**2)
red("the ansatz with exponent A+1 does not satisfy (A.37)",
    not (sp.simplify(c12/k2-(1+2*(1+h)*Z))==0 and sp.simplify(c02/k2-h*(1+h))==0))
# (c) the total-derivative identity with the wrong antiderivative must not close
cand_bad=-h*(1+h)*sp.exp(-v)*v**(h+1)*(1+Z*v)**(-h)
red("the total-derivative step with the exponent -h instead of -1-h is rejected",
    sp.simplify(sp.expand((L-sp.diff(cand_bad,v))))!=0)
# (d) the buggy derivative factor (-h)_m, which this battery itself once used, must fail the ODE
def Hd_bad(Zv,hv,m):
    f=lambda vv: mp.e**(-vv)*vv**hv*mp.rf(-hv,m)*vv**m*(1+Zv*vv)**(-hv-m)
    return mp.quad(f,[0,1,10,mp.inf])/mp.gamma(1+hv)
hv,Zv=mp.mpf('0.0099'),mp.mpf(1)
bad=abs(Zv**2*Hd_bad(Zv,hv,2)+(1+2*(1+hv)*Zv)*Hd_bad(Zv,hv,1)+hv*(1+hv)*Hd_bad(Zv,hv,0))
red("the (-h)_m derivative factor (this battery's own first bug) fails the ODE, residual %s"%mp.nstr(bad,3), bad>mp.mpf('1e-6'))
print(("ALL REDS FIRED" if all(reds) else "A RED DID NOT FIRE")+" (%d/%d)"%(sum(reds),len(reds)))
sys.exit(0 if all(reds) else 1)
