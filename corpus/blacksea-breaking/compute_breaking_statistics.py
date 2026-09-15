# ------------------------------------------------------------------------
# ------------------------------------------------------------------------
# SCRIPT   : compute_breaking_statistics.py
# POURPOSE : This function load the breaking events Events_NNNNN.mat,
#            estimate the breaking statistics and save in a DataFrame
#
# CITATION: Guimaraes, P. V.; Stringari, C. E.; Filipot, J.-F.; Leckler, F.;
#           Chapron, B. and Ardhuin F.; Waves breaking similarity at natural
#           sea?, Submitter to Geophysical Research Letters; 2021
#           DOI:
# ------------------------------------------------------------------------
# ------------------------------------------------------------------------
"""
    Looad breaking events Events_NNNNN.mat and compute statistics, saving in a pandas DataFrame

    Usage:
    -----
    python compute_breaking_statistics <sv directory> <breaking directory> <surface file> <wind speed> <fps>


Example:
-------

    python compute_breaking_area.py ../Breaking/


Explanation:
-----------

            Breaking/   => The breaking directory must contain the Event_NNNNN.mat inside
                           See analyse_breaking_binmatrix.py to create this files

Output:
------
            Breaking/Elipse_brk.pkl
                wave_breaking_event: A unique wave breaking event.
                time : date and time. Use a format that pandas.to_datetime() can understand.
                frame: Sequential number.
                ...

            To load use:
                with open('Breaking/Elipse_brk.pkl', 'rb') as f:
                    df = pickle.load(f)
"""


from shapely.ops import cascaded_union, polygonize
import math
from scipy.spatial import Delaunay
from descartes import PolygonPatch
import matplotlib.gridspec as gridspec
from scipy.spatial import ConvexHull, convex_hull_plot_2d
import os
import sys
import numpy as np
import glob
import matplotlib
# matplotlib.use('Agg') # Must be before importing matplotlib.pyplot or pylab!
import matplotlib.pylab as plt
import scipy.io as sio
import seaborn as sns
from scipy.io import loadmat
import pandas as pd
from netCDF4 import Dataset
import pickle
import alphashape
import matplotlib.patches as patches
# Elipse model
from skimage.measure import EllipseModel, CircleModel
# import miniball
import numpy.linalg as la


##########################
# Get input
##########################
# if len(sys.argv) != 8:
#     print('ERROR: input file must have 7 argument')
#     print('       compute_breaking_area.py Arc_dir breaking_dir SurfaceFile wnd fps fp fp2')
#     sys.exit(" ")
if len(sys.argv) != 6:
    print('ERROR: input file must have 5 argument')
    print('       compute_breaking_area.py Arc_dir breaking_dir SurfaceFile wnd fps')
    sys.exit(" ")
else:
    funcname = sys.argv[0]
    Arc_dir = sys.argv[1]
    brk_dir = Arc_dir+sys.argv[2]
    SurfaceFile = Arc_dir+sys.argv[3]
    wnd = float(sys.argv[4])
    fps = float(sys.argv[5])
    # fp = float(sys.argv[6])
    # fp2 = float(sys.argv[7])


print('################################################################')
print(funcname+' '+Arc_dir)
print('################################################################')

if os.path.isdir(brk_dir):
    print("      and : "+brk_dir)
else:
    sys.exit(brk_dir+" not found")

if os.path.isfile(SurfaceFile):
    print("      and : "+SurfaceFile)
else:
    sys.exit(SurfaceFile+" not found")

SpecFile = SurfaceFile[0:-3]+'_analyse.mat'
if os.path.isfile(SpecFile):
    print("      and : "+SpecFile)
else:
    sys.exit(SpecFile+" not found")

SpecPartition = SurfaceFile[0:-18]+'Spec_partition_BS.mat'
if os.path.isfile(SpecPartition):
    print("      and : "+SpecPartition)
else:
    sys.exit(SpecFile+" not found")
##############################################################################
# Definitions
##############################################################################
mat_files = 'Event_0*.mat'
out_dir = Arc_dir+'FIGS/BREAKING_AREA_ELLIPSE/'
os.system("mkdir -p "+out_dir)


class structtype():
    pass


# ----------------------------------------------------
# Load matlab files
# ----------------------------------------------------
def load_mat(matfile, var):
    """
    Load matlab file

    Parameters:
    ----------
        matfile : 'file.mat'
        vat : matlab variable to be loaded, ex 'Z'

    Returns:
    -------
        varout : output variable in the memory
    """
    MAT = loadmat(matfile)
    varout = MAT[var]
    return varout
# ----------------------------------------------------


# ----------------------------------------------------
# Find elipse equation
# ----------------------------------------------------
def mvee(points, tol=0.00001):
    """
    Finds the ellipse equation in center form (x-c).T * A * (x-c) = 1

    See:
    http://stackoverflow.com/questions/1768197/bounding-ellipse/1768440#1768440

    Parameters:
    ----------
    points : np.ndarray
        Input points. It is an array N*M with N number of samples and M number
        of features (dimensions). In 2D it;s N*2.
    tol : float
        Tolerance for the algorithm. Defaults to 0.0001.

    Returns:
    -------
    A : np.ndarray
        Array with the ellipse parameters.
    C : np.ndarray
        Array with the centers of the ellipse.
    """
    N, d = points.shape
    Q = np.column_stack((points, np.ones(N))).T
    err = tol+1.0
    u = np.ones(N)/N
    while err > tol:
        # assert u.sum() == 1 # invariant
        X = np.dot(np.dot(Q, np.diag(u)), Q.T)
        M = np.diag(np.dot(np.dot(Q.T, la.inv(X)), Q))
        jdx = np.argmax(M)
        step_size = (M[jdx]-d-1.0)/((d+1)*(M[jdx]-1.0))
        new_u = (1-step_size)*u
        new_u[jdx] += step_size
        err = la.norm(new_u-u)
        u = new_u
    c = np.dot(u, points)
    A = la.inv(np.dot(np.dot(points.T, np.diag(u)), points)
               - np.multiply.outer(c, c))/d
    return A, c
# ----------------------------------------------------


# ----------------------------------------------------
# Get elipse parameters
# ----------------------------------------------------
def get_ellipse_parameters(A):
    """
    Finds the ellipse paramters from A.

    See:
    http://stackoverflow.com/questions/1768197/bounding-ellipse/1768440#1768440

    Parameters:
    ----------
    A : np.ndarray
        Use mvee to get the correct array.

    Returns:
    -------
    rx, ry : major and minor axis of the ellipse
        Width and length of the sl
    theta : float
        Angle of rotation with respect to the x axis counterclockwise.
    e: float
        Eccentricity of the ellipse.
    """
    # compute SVD
    U, D, V = la.svd(A)

    # x, y radii.
    rx, ry = 1./np.sqrt(D)

    # Major and minor semi-axis of the ellipse.
    dx, dy = 2 * rx, 2 * ry
    a, b = max(dx, dy), min(dx, dy)

    # eccentricity
    e = np.sqrt(a ** 2 - b ** 2) / a

    arcsin = -1. * np.rad2deg(np.arcsin(V[0][0]))
    arccos = np.rad2deg(np.arccos(V[0][1]))

    # orientation angle (with respect to the x axis counterclockwise).
    theta = arccos if arcsin > 0. else -1. * arccos

    return rx, ry, theta, e
# ----------------------------------------------------


# ----------------------------------------------------
# LOAD netcdf constants
# ----------------------------------------------------
def get_area_duration(ncfile, fps):
    Dataref = Dataset(ncfile, mode='r')
    time = Dataref.variables['time'][:]
    try:
        X = Dataref.variables['X_grid'][:]
        Y = Dataref.variables['Y_grid'][:]
    except:
        X = Dataref.variables['X'][:]
        Y = Dataref.variables['Y'][:]
    dx = np.max(np.gradient(X)[1])
    dy = np.mean(np.gradient(Y)[0])
    nt = len(time)
    nx = len(X)
    ny = len(Y)
    Ttot = nt*(1/fps)
    Atot = nx*dx*ny*dy
    return Atot, Ttot
# ----------------------------------------------------


# ----------------------------------------------------
# def Plot_breaking_frame(Arc_dir, SurfaceFile, f, ev, alpha_ij, alpha_xy, alpha_shape_xy, alpha_shape_ij, points_ij, points_xy, zm, out_dir):
def Plot_breaking_frame(Arc_dir, SurfaceFile, ff_t, ev, AShape_t, alpha_index, EShape_t, out_dir):
    for m in range(len(ff_t)):
        ff = int(ff_t[m])
        mi = int(alpha_index[m])
        # PLOT BREAKING ELIPSE over images
        # print('Start Plot_breaking_frame ...')
        imname = Arc_dir+'output/'+'{:06d}'.format(ff)+'_wd/undistorted/00000001.png'
        imname2 = Arc_dir+'Images_Rect/Rect_'+'{:06d}'.format(ff)+'_02.tif'
        imname3 = Arc_dir+'Images_Rect/Rect_'+'{:06d}'.format(ff)+'_02.tif.bz2'
        if os.path.isfile(imname):
            IM = plt.imread(imname)
        elif os.path.isfile(imname2):
            IM = plt.imread(imname2)
        elif os.path.isfile(imname3):
            os.system('bzip2 -dk '+imname3)
            IM = plt.imread(imname2)
            os.system('rm '+imname2)
        else:
            print("ERROR: IMAGE "+imname+" DOES NOT EXIST")

        # Start plot
        fig = plt.figure(figsize=(9.3, 5))
        # fig, ax = plt.subplots(figsize=(8.5, 5))
        # set up subplot grid
        gridspec.GridSpec(3, 2)

        # large subplot
        ax = plt.subplot2grid((2, 3), (0, 0), colspan=2, rowspan=2)
        plt.imshow(IM, cmap='gray')
        # plot limits:
        ncid = Dataset(SurfaceFile)
        iR = np.squeeze(ncid.variables['iR'][ff, :, :])
        jR = np.squeeze(ncid.variables['jR'][ff, :, :])
        plt.plot(iR[0, :], jR[0, :], color='C0', alpha=0.3)
        plt.plot(iR[-1, :], jR[-1, :], color='C0', alpha=0.3)
        plt.plot(iR[:, 0], jR[:, 0], color='C0', alpha=0.3)
        plt.plot(iR[:, -1], jR[:, -1], color='C0', alpha=0.3)
        ax.add_patch(PolygonPatch(AShape_t[mi].alpha_shape_ij_t.buffer(
            1/AShape_t[mi].alpha_ij), color='r', alpha=0.7))
        plt.title('Event {:06d} Frame {:06d}'.format(ev, ff))
        plt.xlabel(r'$j$ [pixel]')
        plt.ylabel(r'$i$ [pixel]')

        # small subplot 1
        ax = plt.subplot2grid((2, 3), (0, 2))
        plt.imshow(IM, cmap='gray')
        ax.add_patch(PolygonPatch(AShape_t[mi].alpha_shape_ij_t.buffer(
            1/AShape_t[mi].alpha_ij), color='r', alpha=0.5))
        plt.axis([np.nanmin(i)-50, np.nanmax(i)+50, np.nanmax(j)+50, np.nanmin(j)-50])
        plt.axis('off')
        plt.title('zoom')

        # small subplot 2
        ax = plt.subplot2grid((2, 3), (1, 2))
        ax.add_patch(PolygonPatch(AShape_t[mi].alpha_shape_xy_t.buffer(
            1/AShape_t[mi].alpha_xy), color='k', alpha=0.3))
        map1 = plt.scatter(AShape_t[mi].xm_t, AShape_t[mi].ym_t,
                           c=AShape_t[mi].zm_t, cmap='jet', vmin=-1, vmax=1.5)
        cb = plt.colorbar(map1)
        # plot ellipses atributes
        # ax.plot(cx[i], cy[i], marker="+", markersize='20')
        ax.plot([EShape_t.cx_t[m]-EShape_t.rA_t[m]*np.cos(np.deg2rad(EShape_t.thA_t[m])), EShape_t.cx_t[m]+EShape_t.rA_t[m]*np.cos(np.deg2rad(EShape_t.thA_t[m]))],
                [EShape_t.cy_t[m]-EShape_t.rA_t[m]*np.sin(np.deg2rad(EShape_t.thA_t[m])), EShape_t.cy_t[m]+EShape_t.rA_t[m]*np.sin(np.deg2rad(EShape_t.thA_t[m]))])
        ax.quiver(EShape_t.cx_t[m], EShape_t.cy_t[m], EShape_t.vcA*np.cos(np.deg2rad(EShape_t.thA_t[m]-90)),
                  EShape_t.vcA*np.sin(np.deg2rad(EShape_t.thA_t[m]-90)))  # , scale=10., scale_units='inches')
        c = patches.Ellipse((EShape_t.cx_t[m], EShape_t.cy_t[m]), 2*EShape_t.yr_t[m], 2*EShape_t.xr_t[m],  angle=EShape_t.th_t[m],
                            edgecolor='k', facecolor='none', linewidth=1)
        ax.add_artist(c)
        plt.axis([np.nanmin(x)-0.5, np.nanmax(x)+0.5, np.nanmin(y)-0.5, np.nanmax(y)+0.5])
        plt.xlabel(r'$x_{br}$ [m]')
        plt.ylabel(r'$y_{br}$ [m]')
        cb.set_label(r'$z_{br}$ [m]')

        # Save or display results
        plt.tight_layout()
        fname = '{:}Event_{:06d}_frame_{:06d}.png'.format(out_dir, ev, ff)
        plt.savefig(fname, dpi=300)
        # plt.show()
        plt.close()
# ----------------------------------------------------


# ----------------------------------------------------
# Compute cp from spectrum
# ---------------------------------------------------
Fspec = load_mat(SpecFile, 'Fspec')
freq = load_mat(SpecFile, 'freq')
imax, jmax = np.where(Fspec == np.max(Fspec))
fp = np.sum(Fspec[imax.max()-1:imax.max()+2, 0]*freq[imax.max()-1:imax.max()+2, 0]
            )/np.sum(Fspec[imax.max()-1:imax.max()+2, 0])
Cp = 9.81/(2*np.pi*fp)
Cp_min = 9.81/(2*np.pi**1.3*fp)
Cp_max = 9.81/(2*np.pi*0.7*fp)
Hs = 4*np.sqrt(np.trapz(np.squeeze(Fspec), x=np.squeeze(freq)))

fp2 = load_mat(SpecPartition, 'f_p').max()
Cp2 = 9.81/(2*np.pi*fp2)

# Initial breaking frequency from saturation of spectrum
# Blim=0.85*10^(-3); %Ardhuin 2010
Blim = 2.8*10**(-3)  # Phillips 1985
Bf = (((2*np.pi*freq)**5)/(4*np.pi*(9.8**2)))*Fspec
w = np.where(Bf > Blim)
fb0 = freq[w[0][0]]
print('fb0 = ', fb0)

# ----------------------------------------------------
# Compute area
# ----------------------------------------------------
events = sorted(glob.glob(brk_dir+mat_files))
nev = len(events)
# variables to be record
rA_s = []
rB_s = []
ff_s = []
tt_s = []
ev_s = []
At_s = []
Pt_s = []
L_s = []
T_s = []
F_s = []
vm_s = []
v0_s = []
vt_s = []
vt_max_s = []
v_Bm_s = []
v_Am_s = []
th_Bm_s = []
xc_s = []
yc_s = []
dz_s = []
DZ_s = []
mx_s = []
my_s = []
cp = []
mask_s = []


for matfile in events:
    # Temporarely files
    cx = []
    cy = []
    thA_t = []
    xr_t = []
    yr_t = []
    th_s = []
    th_t = []
    rA_t = []
    rB_t = []
    mx = []
    my = []
    ff_t = []
    tt_t = []
    At_t = []
    Pt_t = []
    vm_t = []
    xc_t = []
    yc_t = []
    th_t = []
    cx_t = []
    cy_t = []
    mx_t = []
    my_t = []
    dz_t = []
    alpha_index = []
    mask_t = []
    EShape_t = structtype()

    # print('Loading Breaking Events')
    print('Loading '+matfile)
    ev_name, _ = os.path.splitext(os.path.basename(matfile))
    ev = int(ev_name[6:len(ev_name)])
    z = load_mat(matfile, 'z')
    y = load_mat(matfile, 'y')
    x = load_mat(matfile, 'x')
    t = load_mat(matfile, 't')
    i = load_mat(matfile, 'i')
    j = load_mat(matfile, 'j')
    f = load_mat(matfile, 'f')
    v = load_mat(matfile, 'v')

    MASK = np.isnan(x)*np.isnan(y)*np.isnan(z) == False

    zm = z[MASK]
    ym = y[MASK]
    xm = x[MASK]
    tm = t[MASK]
    im = i[MASK]
    jm = j[MASK]
    fm = f[MASK]

    L = np.sqrt((xm.max() - xm.min())**2 + (ym.max() - ym.min())**2)
    T = np.nanmax(tm) - np.nanmin(tm)
    F = np.nanmax(fm) - np.nanmin(fm)
    vm = v[0, 0]

    tt = np.unique(tm)
    AShape_t = [structtype() for i in range(len(tt))]
    for m in range(len(tt)):
        ff = np.argwhere(tm == tt[m])
        xt = xm[ff[:, 0]]
        yt = ym[ff[:, 0]]
        zt = zm[ff[:, 0]]
        it = im[ff[:, 0]]
        jt = jm[ff[:, 0]]
        ft = fm[ff[:, 0]]

        if len(xt) > 2:
            try:
                points_ij = np.squeeze(np.array([it, jt]))
                points_xy = np.squeeze(np.array([xt, yt]))

                alpha_ij = 0.4
                alpha_xy = 20
                alpha_shape_ij = alphashape.alphashape(points_ij.T, alpha_ij)
                alpha_shape_xy = alphashape.alphashape(points_xy.T, alpha_xy)
                # from alphashape import optimizealpha
                # alpha_shape_xy = alphashape.alphashape(points_xy.T)
                At = alpha_shape_xy.area
                Pt = alpha_shape_xy.length

                # save for plots
                AShape_t[m].alpha_ij = alpha_ij
                AShape_t[m].alpha_xy = alpha_xy
                AShape_t[m].alpha_shape_xy_t = alpha_shape_xy
                AShape_t[m].alpha_shape_ij_t = alpha_shape_ij
                AShape_t[m].points_ij_t = points_ij
                AShape_t[m].points_xy_t = points_xy
                AShape_t[m].zm_t = zt
                AShape_t[m].xm_t = xt
                AShape_t[m].ym_t = yt
                alpha_index = np.append(alpha_index, int(m))

                # Compute elipses in x,y
                try:
                    A, c = mvee(points_xy.T, tol=0.01)
                    xc, yc = c
                    # radius, angle and eccentricity
                    rxt, ryt, theta_t, _ = get_ellipse_parameters(A)
                    if theta_t < 0:
                        theta_t = 180+theta_t
                    # print('theta_t = ', theta_t)
                except Exception:
                    model = CircleModel()
                    model.estimate(points_xy.T)
                    xc, yc, r1t = model.params
                    rxt = ryt   # these are for ellipses only
                    theta_t = 0
                if rxt >= ryt:
                    rA = rxt
                    rB = ryt
                    theta_A = theta_t-90
                else:
                    rA = ryt
                    rB = rxt
                    theta_A = theta_t

                # # Test Plot
                # fig, ax2 = plt.subplots(1, 1, figsize=(10, 5))
                #
                # ax2.plot(points_xy[0, :], points_xy[1, :], 'ok')
                # ax2.add_patch(PolygonPatch(alpha_shape_xy.buffer(1/alpha_xy), color='r', alpha=0.5))
                # ax2.plot(xc, yc, marker="+", markersize='20')
                # ax2.plot([xc-rB*np.cos(np.deg2rad(theta_A-90)), xc+rB*np.cos(np.deg2rad(theta_A-90))],
                #          [yc-rB*np.sin(np.deg2rad(theta_A-90)), yc+rB*np.sin(np.deg2rad(theta_A-90))])
                # ax2.plot([xc-rA*np.cos(np.deg2rad(theta_A)), xc+rA*np.cos(np.deg2rad(theta_A))],
                #          [yc-rA*np.sin(np.deg2rad(theta_A)), yc+rA*np.sin(np.deg2rad(theta_A))])
                # # ax2.plot([xc-ryt*np.cos(np.deg2rad(theta_t)), xc+ryt*np.cos(np.deg2rad(theta_t))],
                # #          [yc-ryt*np.sin(np.deg2rad(theta_t)), yc+ryt*np.sin(np.deg2rad(theta_t))])
                # # ax2.plot([xc-rxt*np.cos(np.deg2rad(90-theta_t)), xc+rxt*np.cos(np.deg2rad(90-theta_t))],
                # #          [yc-rxt*np.sin(np.deg2rad(90-theta_t)), yc+rxt*np.sin(np.deg2rad(90-theta_t))])
                # c = patches.Ellipse((xc, yc), 2*ryt, 2*rxt,  angle=theta_t,
                #                     edgecolor='k', facecolor='none', linewidth=1)
                # ax2.add_artist(c)
                # plt.show()

                ev_s = np.append(ev_s, ev)
                L_s = np.append(L_s, L)
                T_s = np.append(T_s, T)
                F_s = np.append(F_s, F)

                xr_t = np.append(xr_t, rxt)
                yr_t = np.append(yr_t, ryt)
                rA_t = np.append(rA_t, rA)
                rB_t = np.append(rB_t, rB)
                thA_t = np.append(thA_t, theta_A)
                ff_t = np.append(ff_t, ft[0])
                tt_t = np.append(tt_t, tt[m])
                At_t = np.append(At_t, At)
                Pt_t = np.append(Pt_t, Pt)

                vm_t = np.append(vm_t, vm)
                xc_t = np.append(xc_t, xc)
                yc_t = np.append(yc_t, yc)
                th_t = np.append(th_t, theta_t)
                cx_t = np.append(cx_t, xc)
                cy_t = np.append(cy_t, yc)
                # xc_s = np.append(xc_s, np.mean(xt))
                # yc_s = np.append(yc_s, np.mean(yt))
                mx_t = np.append(mx_t, np.mean(xt))
                my_t = np.append(my_t, np.mean(yt))
                dz_t = np.append(dz_t, np.max(zt)-np.min(zt))

                mask_t = np.append(mask_t, False)

            except:
                print('Not abel to braw a polygon')
                ev_s = np.append(ev_s, ev)
                L_s = np.append(L_s, L)
                T_s = np.append(T_s, T)
                F_s = np.append(F_s, F)

                xr_t = np.append(xr_t, np.nan)
                yr_t = np.append(yr_t, np.nan)
                rA_t = np.append(rA_t, np.nan)
                rB_t = np.append(rB_t, np.nan)
                thA_t = np.append(thA_t, np.nan)
                ff_t = np.append(ff_t, ft[0])
                tt_t = np.append(tt_t, tt[m])
                At_t = np.append(At_t, np.nan)
                Pt_t = np.append(Pt_t, np.nan)

                vm_t = np.append(vm_t, np.nan)
                xc_t = np.append(xc_t, np.nan)
                yc_t = np.append(yc_t, np.nan)
                th_t = np.append(th_t, np.nan)
                cx_t = np.append(cx_t, np.nan)
                cy_t = np.append(cy_t, np.nan)
                # xc_s = np.append(xc_s, np.mean(xt))
                # yc_s = np.append(yc_s, np.mean(yt))
                mx_t = np.append(mx_t, np.mean(xt))
                my_t = np.append(my_t, np.mean(yt))
                dz_t = np.append(dz_t, (np.nanmax(zt)-np.nanmin(zt)))

                mask_t = np.append(mask_t, True)

    if len(cx_t) > 1:
        from skimage.restoration import inpaint
        cx_t = inpaint.inpaint_biharmonic(cx_t, mask_t)
        cy_t = inpaint.inpaint_biharmonic(cy_t, mask_t)
        thA_t = inpaint.inpaint_biharmonic(thA_t, mask_t)

        # compute ortongonal propagation velocity
        vcx = np.mean(np.diff(cx_t)/(1/fps))
        vcy = np.mean(np.diff(cy_t)/(1/fps))
        vxyc = np.sqrt(vcx**2+vcy**2)
        th_xyc = np.arctan2(vcy, vcx)

        thB_x = np.mean(1 * np.cos(np.deg2rad(thA_t-90)))
        thB_y = np.mean(1 * np.sin(np.deg2rad(thA_t-90)))
        thBm = np.arctan2(thB_y, thB_x)
        # print('mean theta B  = ', np.rad2deg(thBm))

        vcA = vxyc*np.cos(th_xyc-thBm)
        vcB = vxyc*np.sin(th_xyc-thBm)
        # print('mean VA   = ', vcA)
        # print('mean VB   = ', vcB)

        vmx = np.diff(mx_t)/(1/fps)
        vmy = np.diff(my_t)/(1/fps)
        vt = np.sqrt(vmx**2 + vmx**2)

        f0 = np.argwhere(vt > 0)
        v0 = np.ones(np.size(cx_t))*vt[f0[0]]
        v_Bm_s = np.append(v_Bm_s, np.ones(np.size(cx_t))*vcB)
        v_Am_s = np.append(v_Am_s, np.ones(np.size(cx_t))*vcA)
        th_Bm_s = np.append(th_Bm_s, np.ones(np.size(cx_t))*(thA_t-90))
        vt = np.append(vt[0], vt)
        v0_s = np.append(v0_s, v0)
        vt_s = np.append(vt_s, vt)
        vt_max_s = np.append(vt_max_s, np.ones(np.size(cx_t))*np.max(vt))
        DZ_s = np.append(DZ_s, np.ones(np.size(cx_t))*(np.max(zm)-np.min(zm)))

        rA_s = np.append(rA_s, inpaint.inpaint_biharmonic(rA_t, mask_t))
        rB_s = np.append(rB_s, inpaint.inpaint_biharmonic(rB_t, mask_t))
        ff_s = np.append(ff_s, ff_t)
        tt_s = np.append(tt_s, tt_t)
        At_s = np.append(At_s, inpaint.inpaint_biharmonic(At_t, mask_t))
        Pt_s = np.append(Pt_s, inpaint.inpaint_biharmonic(Pt_t, mask_t))

        vm_s = np.append(vm_s, inpaint.inpaint_biharmonic(vm_t, mask_t))
        xc_s = np.append(xc_s, inpaint.inpaint_biharmonic(xc_t, mask_t))
        yc_s = np.append(yc_s, inpaint.inpaint_biharmonic(yc_t, mask_t))
        th_s = np.append(th_s, inpaint.inpaint_biharmonic(th_t, mask_t))
        # cx_t = np.append(cx_s, cx_t)
        # cy_t = np.append(cy_s, cy_t)
        mx_s = np.append(mx_s, inpaint.inpaint_biharmonic(mx_t, mask_t))
        my_s = np.append(my_s, inpaint.inpaint_biharmonic(my_t, mask_t))
        dz_s = np.append(dz_s, dz_t)
        # dz_s = np.append(dz_s, inpaint.inpaint_biharmonic(dz_t, mask_t))

        EShape_t.cx_t = inpaint.inpaint_biharmonic(cx_t, mask_t)
        EShape_t.cy_t = inpaint.inpaint_biharmonic(cy_t, mask_t)
        EShape_t.rA_t = inpaint.inpaint_biharmonic(rA_t, mask_t)
        EShape_t.thA_t = inpaint.inpaint_biharmonic(thA_t, mask_t)
        EShape_t.vcA = vcA
        EShape_t.yr_t = inpaint.inpaint_biharmonic(yr_t, mask_t)
        EShape_t.xr_t = inpaint.inpaint_biharmonic(xr_t, mask_t)
        EShape_t.th_t = inpaint.inpaint_biharmonic(th_t, mask_t)

        # plot
        # if np.max(ff_t) < 299:
        #     print('Start Plot: ')
        #     Plot_breaking_frame(Arc_dir, SurfaceFile, ff_t, ev,
        #                         AShape_t, alpha_index, EShape_t, out_dir)
        #     print('Figure saved at: '+out_dir)

        mask_s = np.append(mask_s, mask_t)
    else:
        vt = vm
        v0 = vm
        v_Bm_s = np.append(v_Bm_s, vm)
        v_Am_s = np.append(v_Am_s, vm)
        th_Bm_s = np.append(th_Bm_s, vm*0)
        v0_s = np.append(v0_s, v0)
        vt_s = np.append(vt_s, vt)
        vt_max_s = np.append(vt_max_s, np.ones(np.size(cx_t))*np.max(vt))


print('Number of Missing Area = ', np.sum(mask_s))

# Save in pandas dataset
wndstat = np.ones(np.size(At_s))*wnd
fp_s = np.ones(np.size(At_s))*fp
fp2_s = np.ones(np.size(At_s))*fp2
fb0_s = np.ones(np.size(At_s))*fb0
Hs_s = np.ones(np.size(At_s))*Hs
Atot, Ttot = get_area_duration(SurfaceFile, fps)
Atot_s = np.ones(np.size(At_s))*Atot
Ttot_s = np.ones(np.size(At_s))*Ttot
Zstat = ['wave_breaking_event', 'frame', 'time', 'r1_ellipse', 'r2_ellipse', 'x_center', 'y_center',
         'breaking_area', 'breaking_perimeter', 'breaking_length', 'breaking_duration', 'breaking_duration_frame',
         'initial_breaking_speed', 'mean_breaking_speed', 'instantaneus_breaking_speed', 'max_breaking_speed',
         'mean_A_speed_from_ellipse', 'mean_B_speed_from_ellipse', 'mean_breaking_direction_from_ellipse',
         'vertical_extension', 'total_vertical_extension',
         'wind', 'peak_frequency',  'windsea_peak_frequency', 'initial_breaking_frequency', 'significative_wave_hight',
         'sv_area', 'sv_duration']
dstat = {Zstat[0]: ev_s.T, Zstat[1]: ff_s.T, Zstat[2]: tt_s.T,
         # Zstat[5]: xc_s.T, Zstat[6]: yc_s.T,
         Zstat[3]: rA_s.T, Zstat[4]: rB_s.T, Zstat[5]: mx_s.T, Zstat[6]: my_s.T,
         Zstat[7]: At_s.T, Zstat[8]: Pt_s.T, Zstat[9]: L_s.T,  Zstat[10]: T_s.T, Zstat[11]: F_s.T,
         Zstat[12]: v0_s.T, Zstat[13]: vm_s.T, Zstat[14]: vt_s.T, Zstat[15]: vt_max_s.T,
         Zstat[16]: v_Am_s.T, Zstat[17]: v_Bm_s.T, Zstat[18]: th_Bm_s.T,
         Zstat[19]: dz_s.T, Zstat[20]: DZ_s.T,
         Zstat[21]: wndstat.T, Zstat[22]: fp_s.T, Zstat[23]: fp2_s.T, Zstat[24]: fb0_s.T,  Zstat[25]: Hs_s.T,
         Zstat[26]: Atot_s.T, Zstat[27]: Ttot_s.T}
dataset = pd.DataFrame(data=dstat)
dataset.to_pickle(brk_dir+'/Area_brk.pkl')
print('')
print('output saved at '+brk_dir+'/Area_brk.pkl')

print('################################################################')
print(funcname+' '+Arc_dir+'  ENDS WITHOUT ERROR')
print('################################################################')
