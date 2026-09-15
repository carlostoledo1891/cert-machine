# ------------------------------------------------------------------------
# ------------------------------------------------------------------------
#
# SCRIPT   : load_breaking_statistics.py
# POURPOSE :
#
# CITATION: Guimaraes, P. V.; Stringari, C. E.; Filipot, J.-F.; Leckler, F.;
#           Chapron, B. and Ardhuin F.; Waves breaking similarity at natural
#           sea?, Submitter to Geophysical Research Letters; 2021
#           DOI:
# ------------------------------------------------------------------------
# ------------------------------------------------------------------------

# from similaritymeasures import Similarity
from scipy.optimize import curve_fit
from sklearn.linear_model import RANSACRegressor
from sklearn.linear_model import LinearRegression
import matplotlib.pyplot as plt
from scipy.stats import lognorm
import scipy.stats as st
from decimal import Decimal
from math import*
import skill_metrics as sm
from scipy import stats
import numpy.linalg as la
from skimage.measure import EllipseModel, CircleModel
import matplotlib.patches as patches
import alphashape
import pickle
from netCDF4 import Dataset
import pandas as pd
from scipy.io import loadmat
import seaborn as sns
import scipy.io as sio
import matplotlib.pylab as plt
import matplotlib
import glob
import numpy as np
import sys
import os
from scipy.spatial import ConvexHull, convex_hull_plot_2d
import matplotlib.gridspec as gridspec
from descartes import PolygonPatch
from scipy.spatial import Delaunay
import math
from shapely.ops import cascaded_union, polygonize


Area_dir = ''  # add a directory with all Area_brk.pk created by the compute_breaking_statistics.py


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


###################################################################
# LOAD breaking events info
##################################################################
events = sorted(glob.glob(Area_dir+'Area_brk_*.pkl'))
nev = len(events)


def comp_spreading(Rec, flim):
    base_dir = 'dataset/'
    if os.path.isfile(base_dir+Rec+'/3D_DW/Spectrum_Ethf.mat'):
        SpecFile = base_dir+Rec+'/3D_DW/Spectrum_Ethf.mat'
    else:
        SpecFile = base_dir+Rec+'/3D/Spectrum_Ethf.mat'
    E_thf = load_mat(SpecFile, 'E_thf')
    f_plot = np.squeeze(load_mat(SpecFile, 'f_plot'))
    th_plot = np.squeeze(load_mat(SpecFile, 'th_plot'))
    # compute wave moments
    a1 = np.trapz(np.cos(th_plot)*E_thf.T, x=th_plot)/np.trapz(E_thf.T, x=th_plot)
    b1 = np.trapz(np.sin(th_plot)*E_thf.T, x=th_plot)/np.trapz(E_thf.T, x=th_plot)
    sig = 2*np.sqrt(2*(1-np.sqrt(a1**2+b1**2)))
    w = np.where(f_plot > flim)
    sig_mean = np.rad2deg(np.mean(sig[w]))
    return sig_mean


# Define variable names
var_Atot = 'sv_area'
var_Ttot = 'sv_duration'
var_wnd = 'wind'
var_fp = 'peak_frequency'
var_fp2 = 'windsea_peak_frequency'
var_fp2 = 'windsea_peak_frequency'
var_fb0 = 'initial_breaking_frequency'
var_Hs = 'significative_wave_hight'
var_Ab = 'breaking_area'
var_cb = 'initial_breaking_speed'
var_cm = 'mean_breaking_speed'
var_cB = 'mean_B_speed_from_ellipse'
var_cA = 'mean_A_speed_from_ellipse'
var_cdir = 'mean_breaking_direction_from_ellipse'
var_DT = 'breaking_duration'
var_F = 'frame'
var_T = 'time'
var_Le1 = 'r1_ellipse'
var_Le2 = 'r2_ellipse'
var_Lb = 'breaking_length'
var_Pb = 'breaking_perimeter'
var_ev = 'wave_breaking_event'
var_Dz = 'vertical_extension'
var_DzT = 'total_vertical_extension'

Rec = []
ev_ev = []
DT_ev = []
cb_ev = []
cm_ev = []
cA_ev = []
cB_ev = []
cdir_ev = []
Ab_sum_ev = []
Ab_max_ev = []
Ab_mean_ev = []
Lb_sum_ev = []
Pb_sum_ev = []
Lb_max_ev = []
Pb_max_ev = []
Lb_mean_ev = []
Pb_mean_ev = []
LA_sum_ev = []
LB_sum_ev = []
LA_max_ev = []
LB_max_ev = []
LA_mean_ev = []
LB_mean_ev = []
DZ_ev = []
DZ_sum_ev = []
DZ_max_ev = []
DZ_mean_ev = []
BDz_sum_ev = []
BDz_max_ev = []
BDz_mean_ev = []
S_max_ev = []
S_mean_ev = []
wnd_ev = []
svA_ev = []
svT_ev = []
svfp_ev = []
svfp2_ev = []
svfb0_ev = []
Hs_ev = []
Ae_sum_ev = []
Ae_max_ev = []
Ae_mean_ev = []
sig_mean = []
BDz_Lmax_ev = []
th_Lmax_ev = []
DZ_Lmax_ev = []
Ab_Lmax_ev = []

for dataset, r in zip(events, range(len(events))):
    print('Loading '+dataset)
    with open(dataset, 'rb') as f:
        ds = pickle.load(f)
    ev = ds[var_ev]
    nev = np.unique(ev)
    fps = int(dataset[-8:-6])

    # subsample dataset by event
    for brk_ev in nev:
        dev = ds[ds[var_ev] == brk_ev]

        Rec = np.append(Rec, dataset[-38:-4])
        ev_ev = np.append(ev_ev, brk_ev)

        # DT_ev = np.append(DT_ev, dev[var_DT].values[0])
        # DT_ev = np.append(DT_ev, (dev[var_F].values.max()-dev[var_F].values.min())/dev[var_F].values[0] )
        DT_ev = np.append(DT_ev, len(dev)/fps)
        cb_ev = np.append(cb_ev, dev[var_cb].values[0])
        cm_ev = np.append(cm_ev, dev[var_cm].values[0])
        cA_ev = np.append(cA_ev, np.abs(dev[var_cA].values[0]))
        cB_ev = np.append(cB_ev, np.abs(dev[var_cB].values[0]))
        cdir_ev = np.append(cdir_ev, dev[var_cdir].values[0])

        Ab_sum_ev = np.append(Ab_sum_ev, np.sum(dev[var_Ab]))
        Ab_max_ev = np.append(Ab_max_ev, np.max(dev[var_Ab]))
        Ab_mean_ev = np.append(Ab_mean_ev, np.mean(dev[var_Ab]))

        Lb_max_ev = np.append(Lb_max_ev, np.max(dev[var_Lb].values))
        Pb_max_ev = np.append(Pb_max_ev, np.max(dev[var_Pb].values/2))
        Lb_sum_ev = np.append(Lb_sum_ev, np.sum(dev[var_Lb].values))
        Pb_sum_ev = np.append(Pb_sum_ev, np.sum(dev[var_Pb].values/2))
        Lb_mean_ev = np.append(Lb_mean_ev, np.mean(dev[var_Lb].values))
        Pb_mean_ev = np.append(Pb_mean_ev, np.mean(dev[var_Pb].values/2))

        # find max Ellipse ray
        if np.sum(dev[var_Le1]) > np.sum(dev[var_Le2]):
            A = 2*dev[var_Le1]
            B = 2*dev[var_Le2]
        else:
            A = 2*dev[var_Le2]
            B = 2*dev[var_Le2]
        LA_sum_ev = np.append(LA_sum_ev, np.sum(A))
        LB_sum_ev = np.append(LB_sum_ev, np.sum(B))
        LA_max_ev = np.append(LA_max_ev, np.max(A))
        LB_max_ev = np.append(LB_max_ev, np.max(B))
        LA_mean_ev = np.append(LA_mean_ev, np.mean(A))
        LB_mean_ev = np.append(LB_mean_ev, np.mean(B))

        Ae_sum_ev = np.append(Ae_sum_ev, np.sum(np.pi*(A/2)*(B/2)))
        Ae_max_ev = np.append(Ae_max_ev, np.max(np.pi*(A/2)*(B/2)))
        Ae_mean_ev = np.append(Ae_mean_ev, np.mean(np.pi*(A/2)*(B/2)))

        DZ_ev = np.append(DZ_ev, dev[var_Dz].values[0])
        DZ_sum_ev = np.append(DZ_sum_ev, np.sum(dev[var_Dz].values))
        DZ_max_ev = np.append(DZ_max_ev, np.max(dev[var_Dz].values))
        DZ_mean_ev = np.append(DZ_mean_ev, np.mean(dev[var_Dz].values))
        DZ_Lmax_ev = np.append(DZ_Lmax_ev, dev[var_Dz].values[np.argmax(B)])

        BDz = np.sqrt(dev[var_Dz].values**2 + B**2)
        BDz_sum_ev = np.append(BDz_sum_ev, np.sum(BDz))
        BDz_max_ev = np.append(BDz_max_ev, np.max(BDz))
        BDz_mean_ev = np.append(BDz_mean_ev, np.mean(BDz))
        BDz_Lmax_ev = np.append(BDz_Lmax_ev, BDz.values[np.argmax(B)])

        Ab_Lmax_ev = np.append(Ab_Lmax_ev, dev[var_Ab].values[np.argmax(B)])

        S = dev[var_Dz].values/B
        S_max_ev = np.append(S_max_ev, np.max(S))
        S_mean_ev = np.append(S_mean_ev, np.mean(S))

        th_Lmax_ev = np.append(th_Lmax_ev, np.rad2deg(
            np.arctan(dev[var_Dz].values[np.argmax(B)]/BDz.values[np.argmax(B)])))

        wnd_ev = np.append(wnd_ev, dev[var_wnd].values[0])
        svA_ev = np.append(svA_ev, dev[var_Atot].values[0])
        svT_ev = np.append(svT_ev, dev[var_Ttot].values[0])
        svfp_ev = np.append(svfp_ev, dev[var_fp].values[0])
        svfp2_ev = np.append(svfp2_ev, dev[var_fp2].values[0])
        svfb0_ev = np.append(svfb0_ev, dev[var_fb0].values[0])
        Hs_ev = np.append(Hs_ev, dev[var_Hs].values[0])

        # mean directional spreading for short waves in degrees
        sig_mean = np.append(sig_mean, comp_spreading(dataset[-38:-4], dev[var_fb0].values[0]))

# Zstat = ['Ab', 'DT', 'cb', 'cm', 'Lb', 'Pb', 'Lb_max', 'Pb_max',
        # 'LA', 'LB', 'LA_max', 'LB_max', 'wnd', 'svA', 'svT', 'sv_fp', 'sv_fp2']
Zstat = ['DT', 'c0', 'cm', 'cA', 'cB', 'cdir',
         'Ab_sum', 'Ab_max', 'Ab_mean',
         'Lb_sum', 'Pb_sum', 'Lb_max', 'Pb_max', 'Lb_mean', 'Pb_mean',
         'LA_sum', 'LB_sum', 'LA_max', 'LB_max', 'LA_mean', 'LB_mean',
         'Dz_sum', 'Dz_max', 'Dz_mean',
         'BDz_sum', 'BDz_max', 'BDz_mean',
         'S_max', 'S_mean',
         'wnd', 'sv_fp', 'sv_fp2', 'sv_fb0', 'Hs', 'ev', 'Rec',
         'Ae_sum', 'Ae_max', 'Ae_mean',
         'svA', 'svT', 'sig_mean',
         'Dz_Lmax', 'LD81', 'theta', 'Ab_Lmax']
dstat = {Zstat[0]: DT_ev, Zstat[1]: cb_ev, Zstat[2]: cm_ev, Zstat[3]: cA_ev, Zstat[4]: cB_ev, Zstat[5]: cdir_ev,
         Zstat[6]: Ab_sum_ev, Zstat[7]: Ab_max_ev, Zstat[8]: Ab_mean_ev,
         Zstat[9]: Lb_sum_ev, Zstat[10]: Pb_sum_ev, Zstat[11]: Lb_max_ev, Zstat[12]: Pb_max_ev, Zstat[13]: Lb_mean_ev, Zstat[14]: Pb_mean_ev,
         Zstat[15]: LA_sum_ev, Zstat[16]: LB_sum_ev, Zstat[17]: LA_max_ev, Zstat[18]: LB_max_ev, Zstat[19]: LA_mean_ev, Zstat[20]: LB_mean_ev,
         Zstat[21]: DZ_sum_ev, Zstat[22]: DZ_max_ev, Zstat[23]: DZ_mean_ev,
         Zstat[24]: BDz_sum_ev, Zstat[25]: BDz_max_ev, Zstat[26]: BDz_mean_ev,
         Zstat[27]: S_max_ev, Zstat[28]: S_mean_ev,
         Zstat[29]: wnd_ev, Zstat[30]: svfp_ev, Zstat[31]: Hs_ev, Zstat[32]: svfp2_ev, Zstat[33]: svfb0_ev, Zstat[34]: ev_ev, Zstat[35]: Rec,
         Zstat[36]: Ae_sum_ev, Zstat[37]: Ae_max_ev, Zstat[38]: Ae_mean_ev,
         Zstat[39]: svA_ev, Zstat[40]: svT_ev, Zstat[41]: sig_mean,
         Zstat[42]: DZ_Lmax_ev, Zstat[43]: BDz_Lmax_ev, Zstat[44]: th_Lmax_ev, Zstat[45]: Ab_Lmax_ev}

# Zstat[12]: wnd_ev, Zstat[13]: svA_ev, Zstat[14]: svT_ev, Zstat[15]: svfp_ev, Zstat[16]: svfp2_ev}
datastat = pd.DataFrame(data=dstat)
datastat.to_pickle('blacksea_data.pkl')
print('File saved at: '+'blacksea_data.pkl')
##########################################################################
