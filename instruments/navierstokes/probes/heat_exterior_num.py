import mpmath as mp
mp.mp.dps=25
# d^m/dZ^m (1+Zv)^{-h} = (-1)^m (h)_m v^m (1+Zv)^{-h-m}
def Hd(Zv,hv,m):
    f=lambda vv: mp.e**(-vv)*vv**hv*(-1)**m*mp.rf(hv,m)*vv**m*(1+Zv*vv)**(-hv-m)
    return mp.quad(f,[0,1,10,mp.inf])/mp.gamma(1+hv)
worst=0
for hv in [mp.mpf('0.0099'),mp.mpf('0.3'),mp.mpf('0.005')]:
    for Zv in [mp.mpf('0.01'),mp.mpf(1),mp.mpf(50),mp.mpf(1000)]:
        H0,H1,H2=Hd(Zv,hv,0),Hd(Zv,hv,1),Hd(Zv,hv,2)
        res=Zv**2*H2+(1+2*(1+hv)*Zv)*H1+hv*(1+hv)*H0
        worst=max(worst,abs(res)/abs(H0))
        print(f"h={hv} Z={Zv}: H={mp.nstr(H0,10)} ODE residual/H={mp.nstr(res/H0,3)}")
print("worst relative residual:",mp.nstr(worst,3))
hv=mp.mpf('0.0099')
for m in range(5):
    val=Hd(mp.mpf(0),hv,m); claim=(-1)**m*mp.rf(hv,m)*mp.rf(1+hv,m)
    print(f"H^({m})(0) = {mp.nstr(val,14)}  (A.35) claims {mp.nstr(claim,14)}  diff {mp.nstr(val-claim,3)}")
# monotone decay of |H^(m)| in Z (for the sup bound): sample
print("|H''(Z)| at Z=0,1,10,100:",[mp.nstr(abs(Hd(mp.mpf(z),hv,2)),6) for z in (0,1,10,100)])

# ---- RED CONTROLS ----
reds=[]
def red(name,fired):
    print(("RED FIRED " if fired else "RED DID NOT FIRE ")+name); reds.append(fired)
def Hd_bad(Zv,hv,m):
    f=lambda vv: mp.e**(-vv)*vv**hv*mp.rf(-hv,m)*vv**m*(1+Zv*vv)**(-hv-m)
    return mp.quad(f,[0,1,10,mp.inf])/mp.gamma(1+hv)
hv,Zv=mp.mpf('0.0099'),mp.mpf(1)
bad=abs(Zv**2*Hd_bad(Zv,hv,2)+(1+2*(1+hv)*Zv)*Hd_bad(Zv,hv,1)+hv*(1+hv)*Hd_bad(Zv,hv,0))/abs(Hd_bad(Zv,hv,0))
red("the (-h)_m derivative factor (this battery's own first bug) fails the ODE: relative residual %s"%mp.nstr(bad,3), bad>mp.mpf('1e-10'))
wrong=Zv**2*Hd(Zv,hv,2)+(1+2*(1+hv)*Zv)*Hd(Zv,hv,1)+hv*(2+hv)*Hd(Zv,hv,0)
red("the ODE with the coefficient h(2+h) is rejected by the same integral: residual %s"%mp.nstr(abs(wrong),3), abs(wrong)>mp.mpf('1e-10'))
claim_bad=mp.rf(hv,2)*mp.rf(1+hv,2)*2
red("(A.35) with the Pochhammer product doubled is rejected", abs(Hd(mp.mpf(0),hv,2)-claim_bad)>mp.mpf('1e-10'))
print(("ALL REDS FIRED" if all(reds) else "A RED DID NOT FIRE")+" (%d/%d)"%(sum(reds),len(reds)))
import sys; sys.exit(0 if all(reds) else 1)
