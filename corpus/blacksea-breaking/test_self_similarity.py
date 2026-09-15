# ------------------------------------------------------------------------
# ------------------------------------------------------------------------
#
# SCRIPT   : test_self_similarity.py
# POURPOSE : Test if PDFs are sef similar. Fiire 4 at Guimaraes et al. 2021
#            GRL
#
# CITATION: Guimaraes, P. V.; Stringari, C. E.; Filipot, J.-F.; Leckler, F.;
#           Chapron, B. and Ardhuin F.; Waves breaking similarity at natural
#           sea?, Submitter to Geophysical Research Letters; 2021
#           DOI:
# ------------------------------------------------------------------------
# ------------------------------------------------------------------------
from scipy import stats
import numpy as np
import os
import pickle

from scipy.stats import pareto, lognorm

from string import ascii_lowercase

import statsmodels.api as sm

import seaborn as sns
import matplotlib as mpl
import matplotlib.pyplot as plt
sns.set_context("paper", font_scale=1.75, rc={"lines.linewidth": 3.0})
sns.set_style("ticks", {'axes.linewidth': 1,
                        'legend.frameon': True,
                        'axes.facecolor': "w",
                        'grid.color': "k"})
mpl.rcParams['axes.linewidth'] = 2


def compute(x, xfit):
    """Compute the fits."""

    # pareto fit
    pareto_pars = pareto.fit(x)
    pareto_sf = pareto.sf(xfit, *pareto_pars)

    # lognorm fit
    lognorm_pars = lognorm.fit(x)
    lognorm_sf = lognorm.sf(xfit, *lognorm_pars)

    # kde fit
    kde = sm.nonparametric.KDEUnivariate(x)
    kde.fit(gridsize=100, clip=(x.min(), x.max()))
    ecdf = kde.cdf
    kde_sf = 1 - ecdf
    xkde = kde.support

    return pareto_sf, lognorm_sf, xkde, kde.density, kde_sf


def powerfit(x, y, xnew):
    """line fitting on log-log scale"""
    k, m = np.polyfit(np.log(x), np.log(y), 1)
    print(k)
    return np.exp(m) * xnew**(k)


# define the true objective function
def objective(x, a, b):
    return a*(x**2)  # +b


def linearfit(x, a, b):
    return a*x  # +b


if __name__ == '__main__':

    # read
    with open('blacksea_data.pkl', 'rb') as f:
        df = pickle.load(f)

    # compute variables
    df['05Pr_max'] = df['Pb_max']/2.
    Lb_var = '05Pr_max'
    cb_var = 'cm'
    Ab_var = 'Ab_max'
    df["tp"] = 1 / df["sv_fp"]
    df["wavelength"] = (9.81 / (2 * np.pi)) * df["tp"]
    df["D1981"] = df[Ab_var] / df["LD81"]**2  # aspect ratio parameter

    xfit = np.arange(1E-4, 10E1, 1E-4)

    STD = 2  # where the tail starts after the mean

    # select variables
    variables = [(df[cb_var]**2 / 9.81) / (df[Lb_var]),
                 df[Ab_var] / df[Lb_var]**2,
                 df["D1981"]]

    # compute the tails

    df["self_similarity_a"] = (df[cb_var]**2 / 9.81) / (df[Lb_var])
    df["self_similarity_b"] = df[Ab_var] / df[Lb_var]**2
    df["self_similarity_c"] = df["D1981"]

    tail = np.zeros(len(df))
    lim = df["self_similarity_a"].mean(
    ) + (STD * df["self_similarity_a"].std())
    tail[df["self_similarity_a"].values >= lim] = 1
    df["tail_a"] = tail

    tail = np.zeros(len(df))
    lim = df["self_similarity_b"].mean(
    ) + (STD * df["self_similarity_b"].std())
    tail[df["self_similarity_b"].values >= lim] = 1
    df["tail_b"] = tail

    tail = np.zeros(len(df))
    lim = df["self_similarity_c"].mean(
    ) + (STD * df["self_similarity_c"].std())
    tail[df["self_similarity_c"].values >= lim] = 1
    df["tail_c"] = tail

    xlabels = [r"$c_b^2g^{-1} / L_{b}$ $[-]$",
               r"$A_{b} / L_{b}^2$ $[-]$",
               r"$A_{b} / L_{D81}^2$ $[-]$"]

    ylabels = [r"$1 - CDF(c_b^2g^{-1} / L_{b})$ $[-]$",
               r"$1 - CDF(L_{b} / L_{b}^2$ $[-]$",
               r"$1 - CDF(A_{b} / L_{D81}^2)$ $[-]$", ]

    fig, ((ax1, ax2, ax3), (ax4, ax5, ax6)) = plt.subplots(2, 3, figsize=(12, 8))

    for k, ax in enumerate([ax1, ax2, ax3]):

        p_sf, l_sf, xkde, kde, k_sf = compute(variables[k], xfit)

        # whole distribution
        xline = xkde[xkde >= 0]
        yline = powerfit(xline, k_sf[xkde >= 0], xline)

        # only the tail
        target = variables[k].mean() + (STD * variables[k].std())
        idx = np.argmin(np.abs(xkde - target))
        xtail = xkde[idx:]
        ytail = powerfit(xtail, k_sf[idx:], xtail)
        tail_slope = np.mean(np.diff(ytail) / np.diff(xtail))

        ax.loglog(xfit, p_sf, color="seagreen", label="Pareto fit")
        ax.loglog(xfit, l_sf, color="orangered", label="Log-normal Fit")
        ax.loglog(xkde, k_sf, color="dodgerblue", label="KDE", ls="--")

        ax.plot(xline, yline, color="0.2", ls="--", label="Linear trend")
        ax.plot(xtail, ytail, color="0.2", ls="-", label="Linear trend (tail)")

        lg = ax.legend(fontsize=10,)
        lg.get_frame().set_color("w")

        ax.set_xlim(variables[k].min(), variables[k].max())
        ax.set_ylim(1E-4, 5)

        ax.set_xlabel(xlabels[k])
        ax.set_ylabel(ylabels[k])

        sns.despine(ax=ax)

        ax.text(0.03, 0.97, "({})".format(ascii_lowercase[k]),
                zorder=100, transform=ax.transAxes,
                ha="left", va="top",
                bbox=dict(boxstyle="square", ec="none",
                          fc="1", lw=1, alpha=0.7))

    # fig.tight_layout()
    # plt.savefig("self_similarity.png", dpi=300, transparent=True,
    #             pad_inches=0.1, bbox_inches='tight')
    # plt.show()

    xlabels = [r"$c_b}$ $[m/s]$",
               r"$L_b$ $[m]$",
               r"$L_{D81}$ $[m]$"]

    ylabels = [r"$L_{b}}$ $[m]$",
               r"$A_{b} $ $[m^2]$",
               r"$A_{b} $ $[m^2]$"]

    xleg = [r"$c_b^2g^{-1}$",
            r"$L_{b}^2$",
            r"$L_{D81}^2$"]

    yleg = [r"$L_{b}}$",
            r"$A_{b}$",
            r"$A_{b}$"]

    xvar = [cb_var, Lb_var, 'LD81']
    yvar = [Lb_var, Ab_var, Ab_var]

    xlims = [[1, 6], [0, 3], [0, 2]]
    ylims = [[0, 4], [0, 1.5], [0, 1.5]]

    tail_t = ['tail_a', 'tail_b', 'tail_c']

    #fig, (ax1, ax2, ax3) = plt.subplots(1, 3, figsize=(12, 4.5))
    #fig, ax = plt.subplots(1, 1, figsize=(3.5, 4.5))

    for k, ax in enumerate([ax4, ax5, ax6]):
        #k = 0

        # get coeffs of linear fit
        df_sim = df[df[tail_t[k]] == 1]  # simmilar
        df_ran = df[df[tail_t[k]] == 0]  # random

        x_sim = df_sim[xvar[k]].values
        y_sim = df_sim[yvar[k]].values

        x_ran = df_ran[xvar[k]].values
        y_ran = df_ran[yvar[k]].values

        # scatter plot
        ax.scatter(x_ran, y_ran, color=".4", alpha=0.3, linewidth=0)
        ax.scatter(x_sim, y_sim, color="olive", alpha=0.5, linewidth=0)
        from scipy.optimize import curve_fit
        # plot trend line
        popt, pcov = curve_fit(objective, x_ran, y_ran, p0=[0, 0])
        a_ran, b = popt
        popt, pcov = curve_fit(objective, x_sim, y_sim, p0=[0, 0])
        a_sim, b = popt
        if k == 0:
            la_ran = a_ran*9.81
            la_sim = a_sim*9.81
        else:
            la_ran = a_ran
            la_sim = a_sim

        # plot trend line
        xlin = np.expand_dims(np.arange(xlims[k][0], xlims[k][1]+0.1, 0.1), axis=0).T
        yfit_ran = objective(xlin, a_ran, b)
        l_ran = yleg[k]+"={0:.2f}".format(la_ran)+xleg[k]
        ax.plot(xlin, yfit_ran, color='k', label=l_ran)
        slope, intercept, r_value, p_value, std_err = stats.linregress(x_ran**2, y_ran)
        ax.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))

        yfit_sim = objective(xlin, a_sim, b)
        l_sim = yleg[k]+"={0:.2f}".format(la_sim)+xleg[k]
        ax.plot(xlin, yfit_sim, color='g', label=l_sim)
        slope, intercept, r_value, p_value, std_err = stats.linregress(x_sim**2, y_sim)
        ax.plot(np.NaN, np.NaN, color='none',
                label=r"$r={0:.1f}$; $p \ll 0.05$".format(r_value, p_value))

        # removing top and right borders
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)

        ax.legend(prop={'size': 12}, loc='upper left')
        # lg.get_frame().set_color("w")

        ax.set_xlim(xlims[k])
        ax.set_ylim(ylims[k])

        ax.set_xlabel(xlabels[k])
        ax.set_ylabel(ylabels[k])

        ax.set_title("Self-similar {0:.0f}%".format(100*len(df_sim)/(len(df_sim)+len(df_ran))))

        # sns.despine(ax=ax)

        ax.text(0.85, 0.1, "({})".format(ascii_lowercase[k+3]),
                zorder=100, transform=ax.transAxes,
                ha="left", va="top",
                bbox=dict(boxstyle="square", ec="none",
                          fc="1", lw=1, alpha=0.7))

    fig.tight_layout()
    plt.gcf().subplots_adjust(bottom=0.09, left=0.09, right=0.98, top=0.98)  # adjust borders
    plt.savefig("trendline2.png", dpi=300, transparent=True,
                pad_inches=0.1, bbox_inches='tight')
    plt.show()
