# ------------------------------------------------------------------------
# ------------------------------------------------------------------------
#
# SCRIPT   : plot_linear_relation.py
# POURPOSE : Fit best linear relation from the data, peesented at
#           Figure 3, Guimaraes et al. 2021 GRL
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
import skill_metrics as sm
from scipy import stats
import pickle
import pandas as pd
from scipy.io import loadmat
import seaborn as sns
import numpy as np
import os


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


##########################################################################
# PLOT linear regression + density plot Cb:
##########################################################################
with open('blacksea_data.pkl', 'rb') as f:
    datastat = pickle.load(f)


sns.set_context("paper", font_scale=1.4, rc={"lines.linewidth": 1.})
sns.set_style("ticks", {"axes.linewidth": 1.,
                        "legend.frameon": True,
                        "xtick.major.size": 5,
                        "ytick.major.size": 5,
                        "axes.facecolor": "w",
                        "grid.color": "w"})

# # with sns.axes_style("white"):


def linearfit(x, a, b):
    return a*x  # +b


# cb_var = 'cm'
datastat['cbcp'] = datastat['cm']/(9.81/(2*np.pi*datastat['sv_fp']))
cb_var = 'cm'
Ar_var = 'Ab_max'
# Pr_var = 'Pb'
# Ar_max_var = 'Ab_max'
# Pr_max_var = 'Pb_max'
# La_max = 'LA_max'
LB_var = 'LB_max'
dt_var = 'DT'
dz_var = 'Dz_max'
datastat['05Pr_max'] = datastat['Pb_max']/2.
Lr_var = '05Pr_max'


# define the true objective function
def objective(x, a, b):
    return a*(x**2)/9.81  # +b


# Area distribution
# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[Lr_var], datastat[cb_var])
# model = LinearRegression(fit_intercept=True)
model = RANSACRegressor(base_estimator=LinearRegression(fit_intercept=False))
reg = model.fit(np.expand_dims(datastat[cb_var].values, axis=0).T,
                np.expand_dims(datastat[Lr_var].values, axis=0).T)
popt, pcov = curve_fit(objective, datastat[cb_var].values,
                       datastat[Lr_var].values, method='trf', p0=[0, 0])  # , bounds=(0, [1, -0.1, 0.2]))
a, b = popt
popt1, pcov1 = curve_fit(linearfit, datastat[cb_var].values,
                         datastat[Lr_var].values, method='trf', p0=[0, 0])
print('std_err1 - std_err2 = ', np.sqrt(np.diag(pcov1))[0] - np.sqrt(np.diag(pcov))[0])
ylin = np.expand_dims(np.arange(1, 6+0.5, 0.5), axis=0).T
xfit = reg.predict(ylin)
xfit2 = objective(ylin, a, b)
g = sns.JointGrid(x=Lr_var, y=cb_var, data=datastat, height=4.5,
                  ratio=5, ylim=(1., 6.0), xlim=(0, 4.))
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
l1 = r"$L_{{b}}={0:.2f}c_b$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xfit, ylin, color='g', label=l1)
# l2=r"$L_{{b_{{max}}}}={0:.2f}c_b^2/g + {1:.2f}$;".format(a,b)+"\n"+ r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value)
l2 = r"$L_{{b}}={0:.2f}c_b^2/g$;".format(a, b)
g.ax_joint.plot(xfit2, ylin, color='r', label=l2)
g.ax_joint.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))
g.set_axis_labels(r'$L_{b}$ [$m$]', r'$c_b$ [$m/s$]')
# g.annotate(template=""{stat}: {val:.2f}"", loc=1)
# annotate(func, template=""{stat}: {val:.2f}"", fontsize, loc, stat="statName")
#
# g.fig.text(0.6, 0.75, r"$r={0:.1f}$;".format(r_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p \ll 0.05$;".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.80, r"$c_b={0:.2f}L_{{b_{{max}}}}$".format(reg.estimator_.coef_[0, 0],
#                                                              reg.estimator_.intercept_), ha='left', fontsize=11)
legendMain = g.ax_joint.legend(prop={'size': 12}, loc='upper right')
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.15, right=0.98, top=0.98)  # adjust borders
outfilename = 'Jointplot_CbxLb_new'
plt.savefig(outfilename+'.png', dpi=500, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length


# length distribution
# define the true objective function
def objective(x, a, b):
    return a*(x**2)/9.81  # +b


LB_var = 'LD81'
# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[LB_var], datastat[cb_var])
model = RANSACRegressor(base_estimator=LinearRegression(fit_intercept=False))
reg = model.fit(np.expand_dims(datastat[cb_var].values, axis=0).T,
                np.expand_dims(datastat[LB_var].values, axis=0).T)
popt, pcov = curve_fit(objective, datastat[cb_var].values,
                       datastat[LB_var].values, method='trf', p0=[0, 0])  # , bounds=(0, [1, -0.1, 0.2]))
a, b = popt
popt1, pcov1 = curve_fit(linearfit, datastat[cb_var].values,
                         datastat[LB_var].values, method='trf')
print('std_err1 - std_err2 = ', np.sqrt(np.diag(pcov1))[0] - np.sqrt(np.diag(pcov))[0])
ylin = np.expand_dims(np.arange(1, 6+0.5, 0.5), axis=0).T
xfit = reg.predict(ylin)
xfit2 = objective(ylin, a, b)
g = sns.JointGrid(x=LB_var, y=cb_var, data=datastat[datastat[LB_var] < 4.0], height=4.5,
                  ratio=5, ylim=(1., 6.0), xlim=(0, 3.0))
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
l1 = r"$L_{{D81}}={0:.2f}c_b$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xfit, ylin, color='g', label=l1)
# l2=r"$L_{{b_{{max}}}}={0:.2f}c_b^2/g + {1:.2f}$;".format(a,b)+"\n"+ r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value)
l2 = r"$L_{{D81}}={0:.2f}c_b^2/g$;".format(a, b)
g.ax_joint.plot(xfit2, ylin, color='r', label=l2)
g.ax_joint.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))
g.set_axis_labels(r'$L_{{D81}}$ [$m$]', r'$c_b$ [$m/s$]')
legendMain = g.ax_joint.legend(prop={'size': 12}, loc='upper right')
# g.fig.text(0.6, 0.75, r"$r$={0:.1f};".format(r_value), ha='left', fontsize=11)
# # g.fig.text(0.6, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p \ll 0.05$;".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.80, r"c_b={0:.2f}$e_{{B_{{max}}}}$".format(reg.estimator_.coef_[0, 0],
#                                                              reg.estimator_.intercept_), ha='left', fontsize=11)
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.15, right=0.98, top=0.98)  # adjust borders
outfilename = 'Jointplot_CbxLD81_new'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length


# dz distribution
# define the true objective function
def objective(x, a, b):
    return a*(x**2)/9.81


# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[dz_var], datastat[cb_var])
model = RANSACRegressor(base_estimator=LinearRegression(fit_intercept=False))
reg = model.fit(np.expand_dims(datastat[cb_var].values, axis=0).T,
                np.expand_dims(datastat[dz_var].values, axis=0).T)
popt, pcov = curve_fit(objective, datastat[cb_var].values,
                       datastat[dz_var].values, p0=[0, 0])
# bounds=(np.array([datastat[cb_var].min(), datastat[dz_var].min()]),
# np.array([datastat[cb_var].max(), datastat[dz_var].max()])))
a, b = popt
popt1, pcov1 = curve_fit(linearfit, datastat[cb_var].values,
                         datastat[dz_var].values)
# print('std_err1 - std_err2 = ', np.sqrt(np.diag(pcov1))[0] - np.sqrt(np.diag(pcov))[0])
ylin = np.expand_dims(np.arange(1, 6+0.5, 0.5), axis=0).T
xfit = reg.predict(ylin)
xfit2 = objective(ylin, a, b)
g = sns.JointGrid(x=dz_var, y=cb_var, data=datastat, height=4.5,
                  ratio=5, ylim=(1., 6.0), xlim=(0, 1.0))
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
l1 = r"$\Delta z_{{b}}={0:.2f}c_b$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xfit, ylin, color='g', label=l1)
# l2=r"$L_{{b_{{max}}}}={0:.2f}c_b^2/g + {1:.2f}$;".format(a,b)+"\n"+ r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value)
l2 = r"$\Delta z_{{b}}={0:.2f}c_b^2/g$;".format(a, b)
g.ax_joint.plot(xfit2, ylin, color='r', label=l2)
g.ax_joint.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))
g.set_axis_labels(r'$\Delta z_{{b}}$ [$m$]', r'$c_b$ [$m/s$]')
legendMain = g.ax_joint.legend(prop={'size': 12}, loc='upper right')
# g.fig.text(0.6, 0.75, r"$r$={0:.1f};".format(r_value), ha='left', fontsize=11)
# # g.fig.text(0.6, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p \ll 0.05$;".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.80, r"c_b={0:.2f}$e_{{B_{{max}}}}$".format(reg.estimator_.coef_[0, 0],
#                                                              reg.estimator_.intercept_), ha='left', fontsize=11)
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.15, right=0.98, top=0.98)  # adjust borders
outfilename = 'Jointplot_Cbxdz_new'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length


# duration distribution
# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[dt_var], datastat[cb_var])
g = sns.JointGrid(y=cb_var, x=dt_var, data=datastat, height=4.5,
                  ratio=5, ylim=(1., 6.0), xlim=(0.2, 2.0))
model = LinearRegression(fit_intercept=True)
reg = model.fit(np.expand_dims(datastat[dt_var].values, axis=0).T,
                np.expand_dims(datastat[cb_var].values, axis=0).T)
xlin = np.expand_dims(np.arange(0, 2+1), axis=0).T
yfit = reg.predict(xlin)
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
g.ax_joint.plot(xlin, yfit, color='k')
g.set_axis_labels(r'$\Delta t_b$ [s]', r'$c_b$ [$m/s$]')
g.fig.text(0.5, 0.75, r"$r$={0:.1f};".format(r_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
g.fig.text(0.5, 0.70, r"$p \ll 0.05$;".format(p_value), ha='left', fontsize=11)
g.fig.text(0.5, 0.80, r"$c_b={0:.2f}\Delta t_b$ + {1:.1f}".format(reg.coef_[0, 0],
                                                                  reg.intercept_[0]), ha='left', fontsize=11)
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.15, right=0.98, top=0.98)  # adjust borders
outfilename = 'Jointplot_CbxDT_new'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length
##########################################################################

##########################################################################
# New Duncan Plots
##########################################################################
# dz distribution
# define the true objective function
with open('blacksea_data.pkl', 'rb') as f:
    datastat = pickle.load(f)

# dz distribution
# define the true objective function


def linearfit(x, a, b):
    return a*x  # +b


def objective(x, a, b):
    return a*np.sqrt(x)  # +b


# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[dz_var], datastat[dt_var])
model = RANSACRegressor(base_estimator=LinearRegression(fit_intercept=False))
reg = model.fit(np.expand_dims(datastat[dt_var].values, axis=0).T,
                np.expand_dims(datastat[dz_var].values, axis=0).T)
popt, pcov = curve_fit(objective, datastat[dt_var].values,
                       datastat[dz_var].values)  # , bounds=(0, [1, -0.1, 0.2]))
a, b = popt
popt1, pcov1 = curve_fit(linearfit, datastat[dt_var].values, datastat[dz_var].values)
print('std_err1 - std_err2', np.sqrt(np.diag(pcov1)), np.sqrt(np.diag(pcov)))
xlin = np.expand_dims(np.arange(0.2, 3+0.1, 0.1), axis=0).T
yfit = reg.predict(xlin)
yfit2 = objective(xlin, a, b)
g = sns.JointGrid(x=dt_var, y=dz_var, data=datastat, height=4.5,
                  ratio=5, ylim=(0., 1.0), xlim=(0.2, 2.0))
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
l1 = r"$\Delta z_{{b}}={0:.2f}\Delta t_b$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xlin, yfit, color='g', label=l1)
# l2=r"$L_{{b_{{max}}}}={0:.2f}c_b^2/g + {1:.2f}$;".format(a,b)+"\n"+ r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value)
l2 = r"$\Delta z_{{b}}={0:.2f}\sqrt{{\Delta t_b}}$;".format(a, b)
g.ax_joint.plot(xlin, yfit2, color='r', label=l2)
g.ax_joint.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))
g.set_axis_labels(r'$\Delta t_b$ [$s$]', r'$\Delta z_{{b}}$ [$m$]')
legendMain = g.ax_joint.legend(prop={'size': 12}, loc='upper right')
# g.fig.text(0.6, 0.75, r"$r$={0:.1f};".format(r_value), ha='left', fontsize=11)
# # g.fig.text(0.6, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p \ll 0.05$;".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.80, r"c_b={0:.2f}$e_{{B_{{max}}}}$".format(reg.estimator_.coef_[0, 0],
#                                                              reg.estimator_.intercept_), ha='left', fontsize=11)
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.15, right=0.98, top=0.98)  # adjust borders
outfilename = 'Jointplot_dtxdz_new'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length


# dz distribution
# define the true objective function
def objective(x, a, b):
    return a*x**2  # +b


# Fazer LB^2 x A
# Fazer LB x LA

# # Duncan 1981
LB_var = 'LB_mean'
LB_var = 'BDz_max'
# Ab_var = 'Ab_max'
datastat['LB2'] = (datastat[LB_var])*(datastat[LB_var])
datastat["L_D81"] = np.hypot(datastat["Dz_max"].values, datastat["LB_max"].values)
datastat["D1981"] = datastat["Ab_max"] / datastat["L_D81"]**2  # aspect ratio parameter
datastat["theta"] = np.rad2deg(np.arctan(datastat["Dz_max"].values / datastat["L_D81"].values))
# # datastat['LB2'] = datastat['Pb_sum']

LB_var = "L_D81"
# LB_var = 'Pb_max'
# Ab_var = 'Ab_sum'
Ab_var = 'Ab_max'

# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[LB_var], datastat[Ab_var])
model = RANSACRegressor(base_estimator=LinearRegression(fit_intercept=False))
reg = model.fit(np.expand_dims(datastat[LB_var].values, axis=0).T,
                np.expand_dims(datastat[Ab_var].values, axis=0).T)
popt, pcov = curve_fit(objective, datastat[LB_var].values,
                       datastat[Ab_var].values, method='trf')  # , bounds=(0, [1, -0.1, 0.2]))
a, b = popt
popt1, pcov1 = curve_fit(linearfit, datastat[LB_var].values, datastat[Ab_var].values, method='trf')
print('std_err1 - std_err2 = ', np.sqrt(np.diag(pcov1))[0] - np.sqrt(np.diag(pcov))[0])
xlin = np.expand_dims(np.arange(0., 2.1, 0.1), axis=0).T
yfit = reg.predict(xlin)
yfit2 = objective(xlin, a, b)
g = sns.JointGrid(x=LB_var, y=Ab_var, data=datastat, height=4.5,
                  ratio=5, ylim=(0., 1.2), xlim=(0., 2.0))
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
l1 = r"$A_{{b}}={0:.2f}L_{{D81}}$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xlin, yfit, color='g', label=l1)
# l2=r"$L_{{b_{{max}}}}={0:.2f}c_b^2/g + {1:.2f}$;".format(a,b)+"\n"+ r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value)
l2 = r"$A_{{b}}={0:.2f}L_{{D81}}^2$;".format(a, b)
g.ax_joint.plot(xlin, yfit2, color='r', label=l2)
g.ax_joint.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))
g.set_axis_labels(r'$L_{{D81}}$ [$m$]', r'$A_{{b}}}$ [$m^2$]')
legendMain = g.ax_joint.legend(prop={'size': 12}, loc='upper left')
# g.fig.text(0.6, 0.75, r"$r$={0:.1f};".format(r_value), ha='left', fontsize=11)
# # g.fig.text(0.6, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p \ll 0.05$;".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.80, r"c_b={0:.2f}$e_{{B_{{max}}}}$".format(reg.estimator_.coef_[0, 0],
#                                                              reg.estimator_.intercept_), ha='left', fontsize=11)
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.16, right=0.98, top=0.98)  # adjust borders
outfilename = 'Jointplot_Ab_LD81_new'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length


# # Duncan 1981
# LB_var = 'LB_mean'
LB_var = 'BDz_max'
Ab_var = 'Ab_Lmax'
datastat['LB2'] = (datastat[LB_var])*(datastat[LB_var])
# # datastat['LB2'] = datastat['Pb_sum']

# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[LB_var], datastat[Ab_var])
model = RANSACRegressor(base_estimator=LinearRegression(fit_intercept=False))
reg = model.fit(np.expand_dims(datastat[LB_var].values, axis=0).T,
                np.expand_dims(datastat[Ab_var].values, axis=0).T)
popt, pcov = curve_fit(objective, datastat[LB_var].values,
                       datastat[Ab_var].values)  # , bounds=(0, [1, -0.1, 0.2]))
a, b = popt
popt1, pcov1 = curve_fit(linearfit, datastat[LB_var].values, datastat[Ab_var].values)
print('std_err1 - std_err2', np.sqrt(np.diag(pcov1)), np.sqrt(np.diag(pcov)))
xlin = np.expand_dims(np.arange(0., 2.1, 0.1), axis=0).T
yfit = reg.predict(xlin)
yfit2 = objective(xlin, a, b)
g = sns.JointGrid(x=LB_var, y=Ab_var, data=datastat, height=4.5,
                  ratio=5, ylim=(0., 1.), xlim=(0., 2.0))
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
l1 = r"$A_{{b}}={0:.2f}L_{{D81}}$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xlin, yfit, color='g', label=l1)
# l2=r"$L_{{b_{{max}}}}={0:.2f}c_b^2/g + {1:.2f}$;".format(a,b)+"\n"+ r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value)
l2 = r"$A_{{b}}={0:.2f}L_{{D81}}^2$;".format(a, b)
g.ax_joint.plot(xlin, yfit2, color='r', label=l2)
g.ax_joint.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))
g.set_axis_labels(r'$L_{{D81}}$ [$m$]', r'$A_{{b}}$ [$m^2$]')
legendMain = g.ax_joint.legend(prop={'size': 12}, loc='upper left')
# g.fig.text(0.6, 0.75, r"$r$={0:.1f};".format(r_value), ha='left', fontsize=11)
# # g.fig.text(0.6, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p \ll 0.05$;".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.80, r"c_b={0:.2f}$e_{{B_{{max}}}}$".format(reg.estimator_.coef_[0, 0],
#                                                              reg.estimator_.intercept_), ha='left', fontsize=11)
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.16, right=0.98, top=0.98)  # adjust borders
outfilename = 'Jointplot_Ab_maxxLD81_new'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length


# Elipise major and minir axis


def objective(x, a, b):
    return a*x**b  # +b


LB_var = 'LB_mean'
Ab_var = 'LA_mean'
# # datastat['LB2'] = datastat['Pb_sum']

# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[LB_var], datastat[Ab_var])
model = RANSACRegressor(base_estimator=LinearRegression(fit_intercept=False))
reg = model.fit(np.expand_dims(datastat[LB_var].values, axis=0).T,
                np.expand_dims(datastat[Ab_var].values, axis=0).T)
popt, pcov = curve_fit(objective, datastat[LB_var].values,
                       datastat[Ab_var].values)  # , bounds=(0, [1, -0.1, 0.2]))
a, b = popt
popt1, pcov1 = curve_fit(objective, datastat[LB_var].values, datastat[Ab_var].values)
print('std_err1 - std_err2', np.sqrt(np.diag(pcov1)), np.sqrt(np.diag(pcov)))
xlin = np.expand_dims(np.arange(0., 2.1, 0.1), axis=0).T
yfit = reg.predict(xlin)
yfit2 = objective(xlin, a, b)
g = sns.JointGrid(x=LB_var, y=Ab_var, data=datastat, height=4.5,
                  ratio=5, ylim=(0., 4.), xlim=(0., 1.7))
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
l1 = r"$e_{{A}}={0:.2f}e_{{B}}$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xlin, yfit, color='g', label=l1)
# l2=r"$L_{{b_{{max}}}}={0:.2f}c_b^2/g + {1:.2f}$;".format(a,b)+"\n"+ r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value)
l2 = r"$e_{{A}}={0:.2f}e_{{B}}^{{0.75}}$;".format(a, b)
g.ax_joint.plot(xlin, yfit2, color='r', label=l2)
g.ax_joint.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))
g.set_axis_labels(r'$e_{{B}}$ [$m$]', r'$e_{{B}}$ [$m$]')
legendMain = g.ax_joint.legend(prop={'size': 12}, loc='upper left')
# g.fig.text(0.6, 0.75, r"$r$={0:.1f};".format(r_value), ha='left', fontsize=11)
# # g.fig.text(0.6, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.70, r"$p \ll 0.05$;".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.6, 0.80, r"c_b={0:.2f}$e_{{B_{{max}}}}$".format(reg.estimator_.coef_[0, 0],
#                                                              reg.estimator_.intercept_), ha='left', fontsize=11)
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.15, right=0.98, top=0.98)  # adjust borders
outfilename = 'Jointplot_LAxLB_new'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length

##########################################################################
# Compare Area from Alphashape to Area from ELLIPSE
##########################################################################
with open('blacksea_data.pkl', 'rb') as f:
    datastat = pickle.load(f)

# with sns.axes_style("white"):

# Ab_var = 'Ab_sum'
Ab_var = 'Ab_max'
# Ab_var = 'Ab_mean'

# Ae_var = 'Ae_sum'
Ae_var = 'Ae_max'
# Ae_var = 'Ae_mean'


g = sns.JointGrid(x=LB_var, y=Ab_var, data=datastat, height=4.5,
                  ratio=5, ylim=(0., 4.), xlim=(0., 1.7))
# g = g.plot_joint(sns.regplot, color=".4")
g = g.plot_joint(sns.scatterplot, color=".4", linewidth=0)
# g = g.plot_joint(sns.distplot)
g = g.plot_joint(sns.kdeplot, cmap="Blues_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
l1 = r"$e_{{A_{{mean}}}}={0:.2f}e_{{B_{{mean}}}}$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xlin, yfit, color='g', label=l1)
# l2=r"$L_{{b_{{max}}}}={0:.2f}c_b^2/g + {1:.2f}$;".format(a,b)+"\n"+ r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value)
l2 = r"$e_{{A_{{mean}}}}={0:.2f}e_{{B_{{mean}}}}^{{0.75}}$;".format(a, b)
g.ax_joint.plot(xlin, yfit2, color='r', label=l2)
g.ax_joint.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))
g.set_axis_labels(r'$e_{{B_{{mean}}}}$ [$m$]', r'$e_{{B_{{mean}}}}$ [$m$]')
legendMain = g.ax_joint.legend(prop={'size': 12}, loc='upper left')

# Area distribution
# get coeffs of linear fit
slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[Ab_var], datastat[Ae_var])
model = RANSACRegressor(base_estimator=LinearRegression(fit_intercept=False))
reg = model.fit(np.expand_dims(datastat[Ab_var].values, axis=0).T,
                np.expand_dims(datastat[Ae_var].values, axis=0).T)
xlin = np.expand_dims(np.arange(0., 10.1, 0.5), axis=0).T
yfit = reg.predict(xlin)
g = sns.JointGrid(x=Ab_var, y=Ae_var, data=datastat, height=4.5,
                  # ratio=5, ylim=(0., 18), xlim=(0, 6))
                  # ratio=5, ylim=(0., 18), xlim=(0, 2))
                  ratio=5, ylim=(0., 4), xlim=(0, 1))
g = g.plot_joint(sns.regplot, color=".4")
# g = g.plot_joint(sns.distplot)
l1 = r"$e_{{A_{{mean}}}}={0:.2f}e_{{B_{{mean}}}}$;".format(
    reg.estimator_.coef_[0, 0], reg.estimator_.intercept_, r_value, p_value)
g.ax_joint.plot(xlin, yfit, color='g', label=l1)
g = g.plot_joint(sns.kdeplot, cmap="gray_r")  # Dark2, Dark2_r, gray, gray_r,
g = g.plot_marginals(sns.kdeplot, color='k', shade=True)
# g.set_axis_labels(r'$\tilde{A_b}$ [$m^2$]', r'$\tilde{A_e}$ [$m^2$]')
# g.set_axis_labels(r'$\hat{A_b}$ [$m^2$]', r'$\hat{A_e}$ [$m^2$]')
g.set_axis_labels(r'$\overline{A_b}$ [$m^2$]', r'$\overline{A_e}$ [$m^2$]')
# g.annotate(template=""{stat}: {val:.2f}"", loc=1)
# annotate(func, template=""{stat}: {val:.2f}"", fontsize, loc, stat="statName")
#
g.fig.text(0.16, 0.75, r"$r$={0:.1f};".format(r_value), ha='left', fontsize=11)
# g.fig.text(0.16, 0.70, r"$p$={0:.3f};".format(p_value), ha='left', fontsize=11)
# g.fig.text(0.16, 0.80, r"$\tilde{{A_e}}={0:.2f}\tilde{{A_b}}$".format(slope, intercept), ha='left', fontsize=11)
# g.fig.text(0.16, 0.80, r"$\hat{{A_e}}={0:.2f}\hat{{A_b}}$".format(slope, intercept), ha='left', fontsize=11)
g.fig.text(0.16, 0.80, r"$\overline{{A_e}}={0:.2f}\overline{{A_b}}$".format(
    slope, intercept), ha='left', fontsize=11)
plt.tight_layout()
plt.gcf().subplots_adjust(bottom=0.13, left=0.15, right=0.98, top=0.98)  # adjust borders
# outfilename = 'Areas_sum'
# outfilename = 'Areas_max'
outfilename = 'Areas_mean'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()  # Breaking length
##########################################################################

# ####################################################
# Plot breaking statistics in a "taylor" diagram
# ####################################################
with open('blacksea_data.pkl', 'rb') as f:
    datastat = pickle.load(f)


# Zstat = ['DT', 'c0', 'cm', 'cA', 'cB', 'cdir',
#          'Ab_sum', 'Ab_max', 'Ab_mean',
#          'Lb_sum', 'Pb_sum', 'Lb_max', 'Pb_max', 'Lb_mean', 'Pb_mean',
#          'LA_sum', 'LB_sum', 'LA_max', 'LB_max', 'LA_mean', 'LB_mean',
#          'BDz_sum', 'BDz_max', 'BDz_mean',
#          'S_max', 'S_mean',
#          'wnd', 'sv_fp', 'sv_fp2', 'Hs', 'ev', 'Rec',
#          'Ae_sum', 'Ae_max', 'Ae_mean']

datastat['B2'] = datastat['LB_mean']*datastat['LB_mean']


def get_correlation(datastat, varX, varY):
    # import skill_metrics as sm
    slope, intercept, r_value, p_value, std_err = stats.linregress(datastat[varX], datastat[varY])
    pred = slope*datastat[varX] + intercept
    # Get Centered Root-Mean-Square-Deviation (CRMSD)
    crmsd = sm.centered_rms_dev(pred, datastat[varY])
    return std_err, crmsd, r_value, p_value

# Plots to do:
# cb vs Area
# cb vx 2*La
# cb vx 2*Lb
# cb vx Lmax
# cb vx Ltot
# cb vx DT


# spectral definitions
cp = 9.81/(2*np.pi*datastat['sv_fp'].values)
cp2 = 9.81/(2*np.pi*datastat['sv_fp2'].values)

# Normalized Breaking speed
datastat['cm/cp'] = datastat['cm'].values/cp
datastat['cm/cp2'] = datastat['cm'].values/cp2

# Breaking speed
c_var = ['cm', 'c0', 'cB', 'cm/cp']  # , 'cm/cp2'
cl_var = [r'$c_{b}$', r'$c_{0}$', r'$c_{B}$', r'$c_{b}/c_{p}$']  # , r'$c_{b}/c_{p,2}$'
marker = ['X', 'o', 'v', 'd']  # , 'd'

# variables to be tested and area
test_var = ['Ab_max', 'LA_mean', 'LB_mean', 'Pb_mean',
            'LA_max', 'LB_max',  'Pb_max',  'DT', 'Dz_mean']  # , 'S2']
# tl_var = [r'$\tilde{A_b}$', r'$\overline{e_{A}}$', r'$\overline{e_{B}}$', r'$\overline{L{b}}$',
#           r'$\hat{L_{A}}$', r'$\hat{L_{B}}$', r'$\hat{L_{b}}$',
#           r'$\Delta t_b$', r'$\overline{\Delta z_b}$']  # , r'$\overline{s^2}$']
tl_var = [r'$A_{b_{max}}$', r'$e_{A_{mean}}$', r'$e_{B_{mean}}$', r'$L_{b_{mean}}$',
          r'$e_{A_{max}}$', r'$e_{B_{max}}$', r'$L_{b_{max}}$',
          r'$\Delta t_b$', r'$\Delta z_{b_{mean}}$']  # , r'$\overline{s^2}$']
colors = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']
var_wnd = 'wnd'

# os.chdir('/home/pvguima/Dropbox/CARAVELE/SCRIPTS/SUSTAINS/SV')

# measures = Similarity()

std = []
crmsd = []
r = []
p = []
legend = []
colors = []
markers = []
sample = []
# s_euclidean = []
# s_jaccard = []
# s_manhattan = []
# # s_minkowski = []
# s_cosine = []
for i in range(0, len(c_var)):
    for j in range(0, len(test_var)):
        std_err, c_rmsd, r_value, p_value = get_correlation(datastat, c_var[i], test_var[j])
        std = np.append(std, std_err)
        crmsd = np.append(crmsd, c_rmsd)
        r = np.append(r, r_value)
        p = np.append(p, p_value)

        if test_var[j] == 'Pb_mean':
            print(c_var[i], test_var[j], 'r = ', r_value)

        legend = np.append(legend, cl_var[i]+r'$\times$'+tl_var[j])
        colors = np.append(colors, 'C'+str(j))
        markers = np.append(markers, marker[i])
        sample = np.append(sample, [std_err, r_value, cl_var[i]+r'$\times$'+tl_var[j]])


# other similarities:
x_l = ['Ab_max', 'LA_max', 'LA_max', 'Ab_sum', 'Ab_sum', 'Pb_max',
       'Dz_max', 'Dz_max', 'Dz_max', 'LB_max', 'LA_max']
# xleg = [r'$\tilde{A_b}$', r'$\overline{e_{A}}$', r'$\overline{e_{A}}$', r'$\overline{A_b}$', r'$\tilde{A_b}$', r'$\tilde{L_b}$',
# r'$\overline{\Delta z_b}$', r'$\overline{\Delta z_b}$', r'$\overline{\Delta z_b}$', r'$\overline{e_{B}}$', r'$\overline{e_{A}}$']
xleg = [r'$A_{b_{max}}$', r'$e_{A_{max}}$', r'$e_{A_{max}}$', r'$A_{b_{mean}}$', r'$A_{b_{sum}}$', r'$L_{b_{max}}$',
        r'$\Delta z_{b_{max}}$', r'$\Delta z_{b_{max}}$', r'$\Delta z_{b_{max}}$', r'$e_{B_{max}}}$', r'$e_{A_{max}}}$']

y_l = ['Pb_max', 'Pb_max', 'LB_max', 'LD81', 'DT', 'DT', 'DT', 'LB_max', 'Ab_sum']
# yleg = [r'$\tilde{L_b}$', r'$\overline{L_{b}}$', r'$\overline{e_{B}}$', r'$\overline{e_{B}}^2$', r'$\Delta t_b$', r'$\Delta t_b$', r'$\Delta t_b$',
# r'$\overline{e_{B}}$', r'$\overline{A_{b}}$']  # , r'$\overline{s^2}$', r'$\overline{s^2}$', r'$\overline{s^2}$']
yleg = [r'$L_{b_{max}}$', r'$L_{b_{max}}$', r'$e_{B_{max}}}$', r'$L_{D81_{max}}}$', r'$\Delta t_b$', r'$\Delta t_b$', r'$\Delta t_b$',
        r'$e_{B_{max}}}$', r'$A_{b_{sum}}}$']  # , r'$\overline{s^2}$', r'$\overline{s^2}$', r'$\overline{s^2}$']


for x_var, y_var, i in zip(x_l, y_l, range(0, len(x_l))):
    std_err, c_rmsd, r_value, p_value = get_correlation(datastat, x_var, y_var)
    std = np.append(std, std_err)
    crmsd = np.append(crmsd, c_rmsd)
    r = np.append(r, r_value)
    p = np.append(p, p_value)
    print(xleg[i]+r'$\times$'+yleg[i], r_value)

    legend = np.append(legend, xleg[i]+r'$\times$'+yleg[i])
    colors = np.append(colors, 'C'+str(i))
    markers = np.append(markers, '*')
    sample = np.append(sample, [std_err, r_value, xleg[i]+r'$\times$'+yleg[i]])


fig, (ax1, ax2) = plt.subplots(1, 2, figsize=[9.9, 3.7])
# Taylor diagram
for i in range(len(std)):
    ax1.plot(std[i], r[i]**2,
             markers[i],
             markersize=11,
             color=colors[i],
             label=legend[i],
             alpha=0.5)
# Add a figure legend and title
ax1.legend(bbox_to_anchor=(2.23, 1.02), numpoints=1, ncol=5,
           prop=dict(size='small'), loc='upper right', handleheight=1.0, labelspacing=0.9)
# axins = ax1.inset_axes([0.5, 0.5, 0.47, 0.47])
ax1.set_xscale('log')
ax1.set_yscale('log')
ax1.set_ylabel(r'Correlation coefficient ($r$)')
ax1.set_xlabel('Standard error of the estimated gradient')
# # for i in range(len(std)):
#     axins.plot(std[i], r[i]**2,
#                markers[i],
#                markersize=11,
#                color=colors[i],
#                alpha=0.5)
# axins.set_xlim(4e-5, 5e-2)
# axins.set_ylim(1e-1, 1e0)
# axins.set_xscale('log')
# axins.set_yscale('log')
# axins.set_xticklabels('')
# axins.set_yticklabels('')
# ax1.indicate_inset_zoom(axins)
# plt.xlim(1e-5, 1e1)
# remove subplot2 axis
ax2.set_axis_off()
plt.gcf().subplots_adjust(bottom=0.133, left=0.074, right=0.99, top=0.98)  # adjust borders
outfilename = 'Error_diagram.png'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
plt.savefig(outfilename+'.pdf', dpi=500, transparent=True)
plt.show()

#
# outfilename = 'TaylorDiagram.png'
# plt.savefig(outfilename, dpi=300, transparent=True)
# plt.show()

# other similarities:
s_euclidean = np.append(s_euclidean, measures.euclidean_distance(
    datastat[c_var[i]].values, datastat[test_var[j]].values))
s_jaccard = np.append(s_jaccard, measures.jaccard_similarity(
    datastat[c_var[i]].values, datastat[test_var[j]].values))
s_manhattan = np.append(s_manhattan, measures.manhattan_distance(
    datastat[c_var[i]].values, datastat[test_var[j]].values))
# s_minkowski=np.append(s_minkowski,measures.minkowski_distance(datastat[c_var[i]].values,datastat[test_var[j]].values,p_value))
s_cosine = np.append(s_cosine, measures.cosine_similarity(
    datastat[c_var[i]].values, datastat[test_var[j]].values))


stdref = 1
fig = plt.figure(figsize=(11, 4))
ax1 = fig.add_subplot(1, 2, 1, xlabel='X', ylabel='Y')
ax1.axis('off')
# Taylor diagram
dia = TaylorDiagram(stdref, fig=fig, rect=121, label='Reference')
dia.samplePoints[0].set_color('k')  # Mark reference point as a red star
# Add models to Taylor diagram
for i in range(len(std)):
    dia.add_sample(std[i], r[i],
                   marker=markers[i],
                   ms=10, ls='',
                   mfc=colors[i], mec=colors[i],
                   label=legend[i])

# Add RMS contours, and label them
contours = dia.add_contours(levels=5, colors='0.5')  # 5 levels in grey
plt.clabel(contours, inline=1, fontsize=10, fmt='%.0f')

dia.add_grid()                                  # Add grid
dia._ax.axis[:].major_ticks.set_tick_out(True)  # Put ticks outward

# Add a figure legend and title
fig.legend(dia.samplePoints,
           [p.get_label() for p in dia.samplePoints],
           numpoints=1, ncol=4, prop=dict(size='small'), loc='upper right')
# fig.suptitle("Taylor diagram", size='x-large')  # Figure title
plt.gcf().subplots_adjust(bottom=0.13, left=0.05, right=0.9, top=0.9)  # adjust borders
outfilename = 'TaylorDiagram.png'
plt.savefig(outfilename, dpi=300, transparent=True)
plt.show()


plt.hist(r)
plt.xlabel('Correlation Coefficient (r)')
plt.ylabel('Histogram')
plt.show()

fig = plt.figure(figsize=(11, 4))
ax1 = fig.add_subplot(1, 2, 1, xlabel='X', ylabel='Y')
# Taylor diagram
for i in range(len(std)):
    plt.plot(std[i], r[i],
             marker=markers[i],
             markersize=10, color=colors[i],
             label=legend[i])
plt.ylabel('Correlation Coefficient (r)')
plt.xlabel('Standard deviation error')
plt.show()


# 3
# plot:
# s_euclidean = []
# s_jaccard = []
# s_manhattan = []
# # s_minkowski = []
# s_cosine = []

fig = plt.figure(figsize=(11, 4))
ax1 = fig.add_subplot(1, 2, 1, xlabel='X', ylabel='Y')
# Taylor diagram
for i in range(len(std)):
    plt.plot(std[i], s_euclidean[i],
             marker=markers[i],
             markersize=10, color=colors[i],
             label=legend[i])
plt.ylabel('Euclidean Distance')
plt.xlabel('Standard deviation error')
plt.show()

fig = plt.figure(figsize=(11, 4))
ax1 = fig.add_subplot(1, 2, 1, xlabel='X', ylabel='Y')
# Taylor diagram
for i in range(len(std)):
    plt.plot(std[i], s_jaccard[i],
             marker=markers[i],
             markersize=10, color=colors[i],
             label=legend[i])
plt.ylabel('Jaccard Similarity')
plt.xlabel('Standard deviation error')
plt.show()

fig = plt.figure(figsize=(11, 4))
ax1 = fig.add_subplot(1, 2, 1, xlabel='X', ylabel='Y')
# Taylor diagram
for i in range(len(std)):
    plt.plot(std[i], s_manhattan[i],
             marker=markers[i],
             markersize=10, color=colors[i],
             label=legend[i])
plt.ylabel('Manhattan Distance')
plt.xlabel('Standard deviation error')
plt.show()

fig = plt.figure(figsize=(11, 4))
ax1 = fig.add_subplot(1, 2, 1, xlabel='X', ylabel='Y')
# Taylor diagram
for i in range(len(std)):
    plt.plot(std[i], s_cosine[i],
             marker=markers[i],
             markersize=10, color=colors[i],
             label=legend[i])
plt.ylabel('Cosine Similarity')
plt.xlabel('Standard deviation error')
plt.show()
######################################################
