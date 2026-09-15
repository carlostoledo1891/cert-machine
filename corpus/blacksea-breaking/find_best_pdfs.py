# ------------------------------------------------------------------------
# ------------------------------------------------------------------------
#
# SCRIPT   : find_best_pdfs.py
# POURPOSE : Fit the best probability density fucntion from the dataset
#
# CITATION: Guimaraes, P. V.; Stringari, C. E.; Filipot, J.-F.; Leckler, F.;
#           Chapron, B. and Ardhuin F.; Waves breaking similarity at natural
#           sea?, Submitter to Geophysical Research Letters; 2021
#           DOI:
# ------------------------------------------------------------------------
# ------------------------------------------------------------------------

from matplotlib.colors import ListedColormap
from matplotlib import gridspec
import numpy as np
import pandas as pd

import pickle

from fitter import Fitter

import seaborn as sns
import matplotlib as mpl
import matplotlib.pyplot as plt
sns.set_context("paper", font_scale=1.5, rc={"lines.linewidth": 2.0})
sns.set_style("ticks", {'axes.linewidth': 2,
                        'legend.frameon': True,
                        'axes.facecolor': "#E9E9F1",
                        'grid.color': "w"})
mpl.rcParams['axes.linewidth'] = 2

if __name__ == '__main__':

    # read
    with open('blacksea_data.pkll', 'rb') as f:
        dataset = pickle.load(f)

    # compute wave age
    dataset['wave_age'] = (9.81/(2*np.pi*dataset['sv_fp']))/dataset['wnd']
    dataset['cp'] = (9.81/(2*np.pi*dataset['sv_fp']))

    var = "LB_mean"

    distributions = ['gamma', 'rayleigh', 'chi2', "norm", "exponpow", "t", "weibull_min",
                     "lognorm", "pareto"]

    metric = "sumsquare_error"  # "bic"

    wave_age = []
    labels = []
    # best_pdf_1 = []
    # best_pdf_2 = []
    # best_pdf_3 = []
    Ab_best_pdfs = []
    Lb_best_pdfs = []
    LB_best_pdfs = []
    DT_best_pdfs = []
    cb_best_pdfs = []
    cbcp_best_pdfs = []
    Ab_pdfs_sumsquare_error = []
    Lb_pdfs_sumsquare_error = []
    LB_pdfs_sumsquare_error = []
    DT_pdfs_sumsquare_error = []
    cb_pdfs_sumsquare_error = []
    cbcp_pdfs_sumsquare_error = []
    for g, df in dataset.groupby("wave_age"):

        wave_age = wave_age+['{0:1.2f}'.format(g), '{0:1.2f}'.format(g), '{0:1.2f}'.format(g), '{0:1.2f}'.format(
            g), '{0:1.2f}'.format(g), '{0:1.2f}'.format(g), '{0:1.2f}'.format(g), '{0:1.2f}'.format(g), '{0:1.2f}'.format(g)]
        labels = labels+distributions

        # gLb_best_pdfset the data
        data = df['Ab_sum']
        # find the best pdf
        F = Fitter(data.values, distributions=distributions)
        F.fit()
        df_pdfs = F.summary(plot=False, Nbest=len(distributions), method=metric)
        Ab_best_pdfs.append(df_pdfs.index.values)
        Ab_pdfs_sumsquare_error = np.append(
            Ab_pdfs_sumsquare_error, F.df_errors.sumsquare_error.values)
        # best_pdf_1.append(df_pdfs.index[0])
        # best_pdf_2.append(df_pdfs.index[1])
        # best_pdf_3.append(df_pdfs.index[2])

        # get the data
        data = df['Pb_max']
        # find the best pdf
        F = Fitter(data.values, distributions=distributions)
        F.fit()
        df_pdfs = F.summary(plot=False, Nbest=len(distributions), method=metric)
        Lb_best_pdfs.append(df_pdfs.index.values)
        Lb_pdfs_sumsquare_error = np.append(
            Lb_pdfs_sumsquare_error, F.df_errors.sumsquare_error.values)

        # get the data
        data = df['LB_max']
        # find the best pdf
        F = Fitter(data.values, distributions=distributions)
        F.fit()
        df_pdfs = F.summary(plot=False, Nbest=len(distributions), method=metric)
        LB_best_pdfs.append(df_pdfs.index.values)
        LB_pdfs_sumsquare_error = np.append(
            LB_pdfs_sumsquare_error, F.df_errors.sumsquare_error.values)

        # get the data
        data = df['DT']
        # find the best pdf
        F = Fitter(data.values, distributions=distributions)
        F.fit()
        df_pdfs = F.summary(plot=False, Nbest=len(distributions), method=metric)
        DT_best_pdfs.append(df_pdfs.index.values)
        DT_pdfs_sumsquare_error = np.append(
            DT_pdfs_sumsquare_error, F.df_errors.sumsquare_error.values)

        # get the data
        data = df['cm']
        # find the best pdf
        F = Fitter(data.values, distributions=distributions)
        F.fit()
        df_pdfs = F.summary(plot=False, Nbest=len(distributions), method=metric)
        cb_best_pdfs.append(df_pdfs.index.values)
        cb_pdfs_sumsquare_error = np.append(
            cb_pdfs_sumsquare_error, F.df_errors.sumsquare_error.values)

        # get the data
        data = df['cm']/df['cp']
        # find the best pdf
        F = Fitter(data.values, distributions=distributions)
        F.fit()
        df_pdfs = F.summary(plot=False, Nbest=len(distributions), method=metric)
        cbcp_best_pdfs.append(df_pdfs.index.values)
        cbcp_pdfs_sumsquare_error = np.append(
            cbcp_pdfs_sumsquare_error, F.df_errors.sumsquare_error.values)


# organize the data
Zstat = ['Probability Density Function', 'Wave age',
         'cb_error', 'Lb_error', 'LB_error', 'Ab_error', 'DT_error']
dstat = {Zstat[0]: labels, Zstat[1]: wave_age,
         Zstat[2]: cb_pdfs_sumsquare_error, Zstat[3]: Lb_pdfs_sumsquare_error,
         Zstat[4]: LB_pdfs_sumsquare_error, Zstat[5]: Ab_pdfs_sumsquare_error, Zstat[6]: DT_pdfs_sumsquare_error}
ds = pd.DataFrame(data=dstat)


# Count
cb_score = []
cbcp_score = []
Lb_score = []
LB_score = []
Ab_score = []
DT_score = []
for i in range(len(cbcp_best_pdfs)):
    j = 0
    # for j in range(len(distributions)):
    cb_score.append(cb_best_pdfs[i][j])
    cbcp_score.append(cbcp_best_pdfs[i][j])
    Lb_score.append(Lb_best_pdfs[i][j])
    LB_score.append(LB_best_pdfs[i][j])
    Ab_score.append(Ab_best_pdfs[i][j])
    DT_score.append(DT_best_pdfs[i][j])

#################################
## error + best fitting figure ##
#################################
fig = plt.figure(figsize=(13, 15))
# set up subplot grid
gs = gridspec.GridSpec(5, 2, width_ratios=[2.25, 0.75], wspace=0.33, hspace=0.3)

# cb
ax0 = plt.subplot(gs[0])
b = sns.barplot(x='Probability Density Function', y="cb_error",
                hue="Wave age", data=ds, palette="viridis", ax=ax0)
l = plt.legend(bbox_to_anchor=(1.01, 1), borderaxespad=0, prop={'size': 10})
l.set_title('wave age', prop={'size': 10})
ax1 = plt.subplot(gs[1])
c = sns.countplot(cb_score, ax=ax1, order=pd.Series(
    cb_score).value_counts().index, palette="tab10")

# Lb
ax2 = plt.subplot(gs[2])
b = sns.barplot(x='Probability Density Function', y="Lb_error",
                hue="Wave age", data=ds, palette="viridis", ax=ax2)
plt.legend(bbox_to_anchor=(3.01, 1), borderaxespad=0)
ax3 = plt.subplot(gs[3])
c = sns.countplot(Lb_score, ax=ax3, order=pd.Series(
    Lb_score).value_counts().index, palette="tab10")

# LB
ax4 = plt.subplot(gs[4])
sns.barplot(x='Probability Density Function', y="LB_error",
            hue="Wave age", data=ds, palette="viridis", ax=ax4)
plt.legend(bbox_to_anchor=(3.01, 1), borderaxespad=0)
ax5 = plt.subplot(gs[5])
c = sns.countplot(LB_score, ax=ax5, order=pd.Series(
    LB_score).value_counts().index, palette="tab10")

# Ab
ax6 = plt.subplot(gs[6])
b = sns.barplot(x='Probability Density Function', y="Ab_error",
                hue="Wave age", data=ds, palette="viridis", ax=ax6)
plt.legend(bbox_to_anchor=(3.01, 1), borderaxespad=0)
ax7 = plt.subplot(gs[7])
c = sns.countplot(Ab_score, ax=ax7, order=pd.Series(
    Ab_score).value_counts().index, palette="tab10")

# DT
ax8 = plt.subplot(gs[8])
b = sns.barplot(x='Probability Density Function', y="DT_error",
                hue="Wave age", data=ds, palette="viridis", ax=ax8)
plt.legend(bbox_to_anchor=(3.01, 1), borderaxespad=0)
ax9 = plt.subplot(gs[9])
c = sns.countplot(DT_score, ax=ax9, order=pd.Series(
    DT_score).value_counts().index, palette="tab10")

for k, ax in enumerate([ax0, ax1, ax2, ax3, ax4, ax5, ax6, ax7, ax8, ax9]):
    # ax.set_xticklabels(distributions)
    for tick in ax.get_xticklabels():
        tick.set_rotation(15)

ax0.set_ylabel(r'$c_b$'+' \n error')
ax1.set_ylabel('best PDF')
ax2.set_ylabel(r'$L_b$'+' \n error')
ax3.set_ylabel('best PDF')
ax4.set_ylabel(r'$L_B$'+' \n error')
ax5.set_ylabel('best PDF')
ax6.set_ylabel(r'$A_b$'+' \n error')
ax7.set_ylabel('best PDF')
ax8.set_ylabel(r'$\Delta t_b$'+' \n error')
ax9.set_ylabel('best PDF')

ax0.set_xlabel(' ')
ax2.set_xlabel(' ')
ax4.set_xlabel(' ')
ax6.set_xlabel(' ')
ax9.set_xlabel(' ')

plt.gcf().subplots_adjust(bottom=0.06, left=0.08, right=0.98, top=0.98)  # adjust borders
outfilename = 'PDF_best_error'
plt.savefig(outfilename+'.png', dpi=300, transparent=True)
# plt.show()
plt.close()
#################################
