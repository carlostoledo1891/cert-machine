# ------------------------------------------------------------------------
# ------------------------------------------------------------------------
#
# SCRIPT   : plot_histograms.py
# POURPOSE : Plot histraframs used at Figure 2 at Guimaraes et al. 2021 GRL
#
# CITATION: Guimaraes, P. V.; Stringari, C. E.; Filipot, J.-F.; Leckler, F.;
#           Chapron, B. and Ardhuin F.; Waves breaking similarity at natural
#           sea?, Submitter to Geophysical Research Letters; 2021
#           DOI:
# ------------------------------------------------------------------------
# ------------------------------------------------------------------------

import pickle
import numpy as np

from scipy.stats import lognorm, ks_1samp

from string import ascii_lowercase

import seaborn as sns
import matplotlib as mpl
import matplotlib.pyplot as plt
sns.set_context("paper", font_scale=1.75, rc={"lines.linewidth": 2.0})
sns.set_style("ticks", {'axes.linewidth': 1,
                        'legend.frameon': True,
                        'axes.facecolor': "w",
                        'grid.color': "k"})
mpl.rcParams['axes.linewidth'] = 2


if __name__ == '__main__':

    # read data
    with open('blacksea_data.pkl', 'rb') as f:
        df = pickle.load(f)

    # compute wave age
    df['wave_age'] = (9.81 / (2 * np.pi * df['sv_fp'])) / df['wnd']
    df["cp"] = 9.81 / (2 * np.pi * df['sv_fp'])
    df["tp"] = 1 / df["sv_fp"]
    df["wavelength"] = (9.81 / (2 * np.pi)) * df["tp"]

    # Duncan variables
    df["D1981"] = df["Ab_max"] / df["LD81"]**2  # aspect ratio parameter

    variables = [df["Ab_max"] / (df["wavelength"]**2),
                 df["Pb_max"] / df["wavelength"],
                 df["theta"],
                 df["D1981"],
                 df["DT"] / df["tp"],
                 df["cm"]/df["cp"]]
    xlabels = [r"$A_b / \lambda_p^2$ $[-]$",
               r"$L_b / \lambda_p$ $[-]$",
               r"$\theta$ $[^{o}]$",
               r"$A_b / L_{D81}^2$ $[-]$",
               r"$\Delta t_b / t_p$ $[-]$",
               r"$c_b/c_p$ $[-]$"]
    ylabels = [r"$p(A_b / \lambda_p^2$) $[-]$",
               r"$L_b / \lambda_p$) $[-]$",
               r"$p(\theta)$ $[1/^{o}]$",
               r"$p(A_b / L_{D81}^2)$ $[-]$",
               r"$p(\Delta t_b / t_p)$ $[-]$",
               r"$p(c_b/c_p)$ $[-]$"]

    fig, ((ax1, ax2, ax3), (ax4, ax5, ax6)) = plt.subplots(
        2, 3, figsize=(12, 7))

    xlims = [0.0125, 0.6, 65, 2, 0.3, 1.]
    for k, ax in enumerate([ax1, ax2, ax3, ax4, ax5, ax6]):

        # random varible
        X = variables[k]  # - variables[k].mean()

        # KDE and histogram
        sns.histplot(X, ax=ax, stat="density", facecolor="0.5",
                     edgecolor="k", label="Histogram")
        sns.kdeplot(X, ax=ax, color="navy", gridsize=1000,
                    label="KDE", ls="--", zorder=20)
        # fit
        xfit = np.linspace(0, xlims[k], 100)
        pars = lognorm.fit(X)
        ax.plot(xfit, lognorm.pdf(xfit, *pars), color="r",
                label="Log-normal fit")

        dens = lognorm.pdf(xfit, *pars)
        peak = xfit[np.argmax(dens)]
        print("peak of ", xlabels[k], "is at ", np.round(peak, 2))

        # K-S test
        ks, p = ks_1samp(X, lognorm.cdf, args=pars, mode="exact",
                         alternative="two-sided")
        txt = "$K$-$S$={}, p={}".format(np.round(ks, 3), np.round(p, 3))
        ax.text(0.95, 0.5, txt, fontsize=11,
                zorder=100, transform=ax.transAxes,
                ha="right", va="top",
                bbox=dict(boxstyle="square", ec="none",
                          fc="1", lw=1, alpha=0.7))

        lg = ax.legend(fontsize=12)
        lg.get_frame().set_color("w")

        ax.set_xlabel(xlabels[k])
        ax.set_ylabel(ylabels[k])

        ax.set_xlim(0, xlims[k])

        sns.despine()

        ax.text(0.95, 0.05, "({})".format(ascii_lowercase[k]),
                zorder=100, transform=ax.transAxes,
                ha="right", va="bottom",
                bbox=dict(boxstyle="square", ec="none",
                            fc="1", lw=1, alpha=0.7))

    ax3.axvspan(10, 14.7, color="forestgreen", label="Duncan (1981)", alpha=0.4)
    lg = ax3.legend(loc=1, fontsize=12)
    lg.get_frame().set_color("w")

    ax4.axvline(0.11, color="forestgreen", label="Duncan (1981)", lw=3)
    # ax4.axvline(df["D1981"].mean(), color="indigo", label=r"$\mu$")
    # ax4.axvspan(df["D1981"].mean()-df["D1981"].std(),
    # df["D1981"].mean()+df["D1981"].std(), color="indigo", alpha=0.25,
    # label=r"$\mu \pm \sigma$")
    lg = ax4.legend(loc=1, fontsize=12)
    lg.get_frame().set_color("w")

    ax6.set_xlim(0.1, 0.9)

    fig.tight_layout()

    plt.savefig("histograms.png", dpi=300, pad_inches=0.1, bbox_inches='tight')
    plt.show()
    plt.close()
