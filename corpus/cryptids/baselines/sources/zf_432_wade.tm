#! start 0a.boot1.A
# Based on the NQL register machine:
# <https://github.com/sorear/metamath-turing-machines>
#
# States that begin with a digit are the states for the framework of the
# register machine implemented in a turing machine. States that don't begin
# with a digit are the decision tree states from the subroutines and main().
#
# 0a. boot1
#
# boot1 isn't quite BB(5) but leaves the tape in a good state for boot2.
#
0a.boot1.A 0 1 R 0a.boot1.B
0a.boot1.A 1 1 L 0a.boot1.C
0a.boot1.B 0 0 L 0a.boot1.A
0a.boot1.B 1 0 L 0a.boot1.D
0a.boot1.C 0 1 L 0a.boot1.A
#
# At the end of boot1 the tape looks like this:
# 10101010101010101010101010101010101[1]01111000000000000000000000000000000
# with 1909 singleton 1s.
#
# Fortunately the right side of the tape looks like it is part way through
# a register operation so by transitioning to the right register operation
# state we can complete the operation and clean up the tape to a good state
# to start boot2.
#
0a.boot1.C 1 1 R 3.prooflist.inc
0a.boot1.D 0 1 L 0a.boot1.B
0a.boot1.D 1 1 R 0a.boot1.E
0a.boot1.E 0 0 R 0a.boot1.D
0a.boot1.E 1 0 R 0a.boot1.B
#
# 0b. boot2
#
# In boot2 we are going through dispatch and can use much of the framework
# loop to help clean up the PC and initialize the registers.
# In particular, boot2 relies on a successful decnz adding one
# register to the register file as a side-effect.
#
# The boot2 decision "tree" works a bit differently from the regular machine.
# The end of the PC alternates between:
# ...110 - increment register 0
# ...111 - decrement register 0
# boot2 scans right on the PC until encountering one of these two patterns.
#
# At the end of the boot2 phase the PC contains "11",
# there are 3822 0s between the PC and the register file,
# and the register file contains 1909 registers plus the -1 marker register.
#
# 0b.boot2.0 0 is not used by the boot2 process so we take advantage of this
# half state for 2e register operations.
0b.boot2.0 0 1 L 6.continue.0
0b.boot2.0 1 1 R 0b.boot2.1
0b.boot2.1 0 0 R 0b.boot2.0
0b.boot2.1 1 1 R 0b.boot2.2
0b.boot2.2 0 0 R 3.prooflist.inc
0b.boot2.2 1 1 R 3.prooflist.decnz
#
# 1. 2. 3. Register manipulation
#
# The normal form of the tape is:
#
# 11010110010010000000000000001011101010101110101100
# [ PC        ][ 0s          ]^^[ unary registers ]^
#                             |                    |
#                             -1 register          Last register terminated with 00
#
# The boundry between the PC and the 0s before the register file is
# implicit in the decision tree. The PC starts with the leftmost 1 on the tape.
#
# During a register operation the tape is modified as follows:
#
# 1a. A marker is placed at the end of the PC (handled by half of state 3.):
#
# 11010110010011000000000000001011101010101110101100
# [ PC        ]^[ 0s         ]^^[ unary registers ]^
#              |              |                    |
#              marker         -1 register          Last register terminated with 00
#
# 1b. The -1 register is extended to the left almost to the marker:
#
# 11010110010011011111111111111011101010101110101100
# [ PC        ]^ [ -1 register ][ unary registers ]^
#              |                                   |
#              marker                              Last register terminated with 00
#
# 1c. We go through dispatch again.
#
# 2a. The marker is removed from the end of the PC (handled by the other half of state 3.):
#
# 11010110010010011111111111111011101010101110101100
# [ PC        ]^ [ -1 register ][ unary registers ]^
#              |                                   |
#              00 before the -1 register           Last register terminated with 00
#
# 2b. The sepecific register operation is performed:
#
# 110101100100100111111111111110111101010101110101100
# [ PC        ]^ [ -1 register ][ unary registers  ]^
#              |                                    |
#              00 before the -1 register            Last register terminated with 00
#
# 2c. The result of the register operation is returned to the PC.
# 00 before the -1 register marks where the PC ends.
#
# 2d. The PC is adjusted:
#
# 110101100101000111111111111110111101010101110101100
# [ PC        ]^ [ -1 register ][ unary registers  ]^
#              |                                    |
#              00 before the -1 register            Last register terminated with 00
#
# 2e. The -1 register is reduced back to a single 1:
#
# 110101100101000000000000000010111101010101110101100
# [ PC        ][ zeros       ]^^[ unary registers  ]^
#                             |                     |
#                             -1 register           Last register terminated with 00
#
# 2f. We are back in normal form and go back through dispatch to start executing
# the next instruction. The length of the PC may be longer or shorter for the
# next operation than it was for the register operation.
#
1b.reg.prep_1 0 0 R 1b.reg.prep_2
1b.reg.prep_2 0 1 R 1b.reg.prep_2
1b.reg.prep_2 1 1 L 6.continue.0
2b.reg.-1.dec 0 0 R 2b.reg.-2.dec
2b.reg.-1.dec 1 1 R 2b.reg.-1.dec
2b.reg.-1.inc 0 0 R 2b.reg.-2.inc
2b.reg.-1.inc 1 1 R 2b.reg.-1.inc
# 2b.reg.-2.dec does double duty to restore a register and return if a
# decnz fails.
2b.reg.-2.dec 0 1 L 2c.reg.return_1_1
2b.reg.-2.dec 1 0 R 2b.reg.dec.check
2b.reg.-2.inc 0 1 R 2b.reg.inc.shift_1
2b.reg.-2.inc 1 1 R 2b.reg.-2.inc
2b.reg.0.dec 0 0 R 2b.reg.-1.dec
2b.reg.0.dec 1 1 R 2b.reg.0.dec
2b.reg.0.inc 0 0 R 2b.reg.-1.inc
2b.reg.0.inc 1 1 R 2b.reg.0.inc
2b.reg.1.dec 0 0 R 2b.reg.0.dec
2b.reg.1.dec 1 1 R 2b.reg.1.dec
2b.reg.1.inc 0 0 R 2b.reg.0.inc
2b.reg.1.inc 1 1 R 2b.reg.1.inc
2b.reg.10.dec 0 0 R 2b.reg.9.dec
2b.reg.10.dec 1 1 R 2b.reg.10.dec
2b.reg.10.inc 0 0 R 2b.reg.9.inc
2b.reg.10.inc 1 1 R 2b.reg.10.inc
2b.reg.2.dec 0 0 R 2b.reg.1.dec
2b.reg.2.dec 1 1 R 2b.reg.2.dec
2b.reg.2.inc 0 0 R 2b.reg.1.inc
2b.reg.2.inc 1 1 R 2b.reg.2.inc
2b.reg.3.dec 0 0 R 2b.reg.2.dec
2b.reg.3.dec 1 1 R 2b.reg.3.dec
2b.reg.3.inc 0 0 R 2b.reg.2.inc
2b.reg.3.inc 1 1 R 2b.reg.3.inc
2b.reg.4.dec 0 0 R 2b.reg.3.dec
2b.reg.4.dec 1 1 R 2b.reg.4.dec
2b.reg.4.inc 0 0 R 2b.reg.3.inc
2b.reg.4.inc 1 1 R 2b.reg.4.inc
2b.reg.5.dec 0 0 R 2b.reg.4.dec
2b.reg.5.dec 1 1 R 2b.reg.5.dec
2b.reg.5.inc 0 0 R 2b.reg.4.inc
2b.reg.5.inc 1 1 R 2b.reg.5.inc
2b.reg.6.dec 0 0 R 2b.reg.5.dec
2b.reg.6.dec 1 1 R 2b.reg.6.dec
2b.reg.6.inc 0 0 R 2b.reg.5.inc
2b.reg.6.inc 1 1 R 2b.reg.6.inc
2b.reg.7.dec 0 0 R 2b.reg.6.dec
2b.reg.7.dec 1 1 R 2b.reg.7.dec
2b.reg.7.inc 0 0 R 2b.reg.6.inc
2b.reg.7.inc 1 1 R 2b.reg.7.inc
2b.reg.8.dec 0 0 R 2b.reg.7.dec
2b.reg.8.dec 1 1 R 2b.reg.8.dec
2b.reg.8.inc 0 0 R 2b.reg.7.inc
2b.reg.8.inc 1 1 R 2b.reg.8.inc
2b.reg.9.dec 0 0 R 2b.reg.8.dec
2b.reg.9.dec 1 1 R 2b.reg.9.dec
2b.reg.9.inc 0 0 R 2b.reg.8.inc
2b.reg.9.inc 1 1 R 2b.reg.9.inc
2b.reg.dec.check 0 0 L 2b.reg.-2.dec
2b.reg.dec.check 1 1 R 2b.reg.dec.scan_1
2b.reg.dec.scan_1 0 0 R 2b.reg.dec.scan_2
2b.reg.dec.scan_1 1 1 R 2b.reg.dec.scan_1
2b.reg.dec.scan_2 0 0 L 2b.reg.dec.shift_1
2b.reg.dec.scan_2 1 1 R 2b.reg.dec.scan_1
2b.reg.dec.shift_1 0 1 L 2b.reg.dec.shift_2
2b.reg.dec.shift_1 1 1 L 2b.reg.dec.shift_1
2b.reg.dec.shift_2 0 0 L 2c.reg.return_0_1
2b.reg.dec.shift_2 1 0 L 2b.reg.dec.shift_1
2b.reg.inc.shift_1 0 0 L 2c.reg.return_0_1
2b.reg.inc.shift_1 1 0 R 2b.reg.inc.shift_2
2b.reg.inc.shift_2 0 1 R 2b.reg.inc.shift_1
2b.reg.inc.shift_2 1 1 R 2b.reg.inc.shift_2
2c.reg.return_0_1 0 0 L 2c.reg.return_0_2
2c.reg.return_0_1 1 1 L 2c.reg.return_0_1
2c.reg.return_0_2 0 0 L 6.break.0
2c.reg.return_0_2 1 1 L 2c.reg.return_0_1
2c.reg.return_1_1 0 0 L 2c.reg.return_1_2
2c.reg.return_1_1 1 1 L 2c.reg.return_1_1
2c.reg.return_1_2 0 0 L 6.break.1
2c.reg.return_1_2 1 1 L 2c.reg.return_1_1
2e.reg.cleanup_1 0 0 R 2e.reg.cleanup_1
2e.reg.cleanup_1 1 0 R 2e.reg.cleanup_2
# We use the otherwise unused 0 slot of 0b.boot2.0 to restore the -1
# register and return to dispatch
2e.reg.cleanup_2 0 0 L 0b.boot2.0
2e.reg.cleanup_2 1 0 R 2e.reg.cleanup_2
3.axiomcode.decnz 0 1 R 1b.reg.prep_1
3.axiomcode.decnz 1 0 R 2b.reg.4.dec
3.axiomcode.inc 0 1 R 1b.reg.prep_1
3.axiomcode.inc 1 0 R 2b.reg.4.inc
3.nextproof.decnz 0 1 R 1b.reg.prep_1
3.nextproof.decnz 1 0 R 2b.reg.1.dec
3.nextproof.inc 0 1 R 1b.reg.prep_1
3.nextproof.inc 1 0 R 2b.reg.1.inc
3.param1.decnz 0 1 R 1b.reg.prep_1
3.param1.decnz 1 0 R 2b.reg.5.dec
3.param1.inc 0 1 R 1b.reg.prep_1
3.param1.inc 1 0 R 2b.reg.5.inc
3.param2.decnz 0 1 R 1b.reg.prep_1
3.param2.decnz 1 0 R 2b.reg.6.dec
3.param2.inc 0 1 R 1b.reg.prep_1
3.param2.inc 1 0 R 2b.reg.6.inc
3.param3.decnz 0 1 R 1b.reg.prep_1
3.param3.decnz 1 0 R 2b.reg.7.dec
3.param3.inc 0 1 R 1b.reg.prep_1
3.param3.inc 1 0 R 2b.reg.7.inc
3.prooflist.decnz 0 1 R 1b.reg.prep_1
3.prooflist.decnz 1 0 R 2b.reg.0.dec
3.prooflist.inc 0 1 R 1b.reg.prep_1
3.prooflist.inc 1 0 R 2b.reg.0.inc
3.scratch1.decnz 0 1 R 1b.reg.prep_1
3.scratch1.decnz 1 0 R 2b.reg.8.dec
3.scratch1.inc 0 1 R 1b.reg.prep_1
3.scratch1.inc 1 0 R 2b.reg.8.inc
3.scratch2.decnz 0 1 R 1b.reg.prep_1
3.scratch2.decnz 1 0 R 2b.reg.9.dec
3.scratch2.inc 0 1 R 1b.reg.prep_1
3.scratch2.inc 1 0 R 2b.reg.9.inc
3.scratch3.decnz 0 1 R 1b.reg.prep_1
3.scratch3.decnz 1 0 R 2b.reg.10.dec
3.scratch3.inc 0 1 R 1b.reg.prep_1
3.scratch3.inc 1 0 R 2b.reg.10.inc
3.topwff.decnz 0 1 R 1b.reg.prep_1
3.topwff.decnz 1 0 R 2b.reg.2.dec
3.topwff.inc 0 1 R 1b.reg.prep_1
3.topwff.inc 1 0 R 2b.reg.2.inc
3.wffstack.decnz 0 1 R 1b.reg.prep_1
3.wffstack.decnz 1 0 R 2b.reg.3.dec
3.wffstack.inc 0 1 R 1b.reg.prep_1
3.wffstack.inc 1 0 R 2b.reg.3.inc
#
# 4. dispatch
#
# Find the start of the PC. We pass by a set number of 0 cells going
# left (how many depends on the decision tree), then scan right for the
# first 1 cell.
#
4.dispatch.0 0 0 L 4.dispatch.scan
4.dispatch.0 1 1 L 4.dispatch.0
4.dispatch.1 0 0 L 4.dispatch.0
4.dispatch.1 1 1 L 4.dispatch.1
4.dispatch.10 0 0 L 4.dispatch.9
4.dispatch.10 1 1 L 4.dispatch.10
4.dispatch.11 0 0 L 4.dispatch.10
4.dispatch.11 1 1 L 4.dispatch.11
4.dispatch.12 0 0 L 4.dispatch.11
4.dispatch.12 1 1 L 4.dispatch.12
4.dispatch.13 0 0 L 4.dispatch.12
4.dispatch.13 1 1 L 4.dispatch.13
4.dispatch.14 0 0 L 4.dispatch.13
4.dispatch.14 1 1 L 4.dispatch.14
4.dispatch.2 0 0 L 4.dispatch.1
4.dispatch.2 1 1 L 4.dispatch.2
4.dispatch.3 0 0 L 4.dispatch.2
4.dispatch.3 1 1 L 4.dispatch.3
4.dispatch.4 0 0 L 4.dispatch.3
4.dispatch.4 1 1 L 4.dispatch.4
4.dispatch.5 0 0 L 4.dispatch.4
4.dispatch.5 1 1 L 4.dispatch.5
4.dispatch.6 0 0 L 4.dispatch.5
4.dispatch.6 1 1 L 4.dispatch.6
4.dispatch.7 0 0 L 4.dispatch.6
4.dispatch.7 1 1 L 4.dispatch.7
4.dispatch.8 0 0 L 4.dispatch.7
4.dispatch.8 1 1 L 4.dispatch.8
4.dispatch.9 0 0 L 4.dispatch.8
4.dispatch.9 1 1 L 4.dispatch.9
4.dispatch.scan 0 0 R 4.dispatch.scan
4.dispatch.scan 1 1 R 5.root.1
#
# 5. The root of the PC decision tree:
# 10 - in boot2 phase
# 110 - in main subroutine
# 111 - main subroutine has completed. (Loop back to 110)
#
# In the boot2 phase we may be at a false root, but due to the
# way boot2 works this doesn't cause problems.
#
5.root.1 0 0 R 0b.boot2.0
5.root.1 1 1 R 5.root.1.1
5.root.1.1 0 0 R main().0
5.root.1.1 1 0 R main().0
#
#
# 6. PC jump instructions.
#
# We don't know if we got to break.0 from phase two of a register instruction
# or not. Tranisition to the reg -1 cleanup state unconditionally. If we're
# not transitioning from a register operation this cleanup won't do anything
# and we'll end up back in dispatch regardless.
#
6.break.0 0 1 R 2e.reg.cleanup_1
6.break.0 1 0 L 6.break.0
6.break.1 0 0 L 6.break.0
6.break.1 1 0 L 6.break.1
6.break.2 0 0 L 6.break.1
6.break.2 1 0 L 6.break.2
6.continue.0 0 0 L 6.continue.0
6.continue.0 1 1 L 4.dispatch.14
6.continue.1 0 0 L 6.continue.1
6.continue.1 1 0 L 6.continue.0
6.continue.2 0 0 L 6.continue.2
6.continue.2 1 0 L 6.continue.1
6.continue.3 0 0 L 6.continue.3
6.continue.3 1 0 L 6.continue.2
cons().0 0 0 R n_165.0
cons().0 1 1 R cons().1
cons().1 0 0 R pair(scratch2,scratch1,topwff).0
cons().1 1 1 R while_decnz(scratch2,3.topwff.inc).0
cparam().n_91.0 0 0 R cparam().n_91.0.0
cparam().n_91.0 1 0 L 6.break.1
cparam().n_91.0.0 0 0 R 3.axiomcode.decnz
cparam().n_91.0.0 1 1 R cparam().n_91.0.1
cparam().n_91.0.1 0 0 R cparam().n_91.0.1.0
cparam().n_91.0.1 1 1 R cparam().n_91.0.2
cparam().n_91.0.1.0 0 0 R 3.axiomcode.decnz
cparam().n_91.0.1.0 1 1 R cparam().n_91.0.1.1
cparam().n_91.0.1.1 0 0 R cparam().n_91.0.1.1.0
cparam().n_91.0.1.1 1 0 L 6.break.1
cparam().n_91.0.1.1.0 0 0 R 3.axiomcode.inc
cparam().n_91.0.1.1.0 1 1 R 3.axiomcode.inc
cparam().n_91.0.2 0 0 R cparam().n_91.0.2.0
cparam().n_91.0.2 1 0 L 6.break.1
cparam().n_91.0.2.0 0 0 R 3.axiomcode.inc
cparam().n_91.0.2.0 1 1 R n_165.0
cparam(param2).0 0 0 R cparam().n_91.0
cparam(param2).0 1 1 R cparam(param2).1
cparam(param2).1 0 0 R while_decnz(param2,()).0
cparam(param2).1 1 1 R while_decnz(scratch1,3.param2.inc).0
cparam(param3).0 0 0 R cparam().n_91.0
cparam(param3).0 1 1 R cparam(param3).1
cparam(param3).1 0 0 R while_decnz(param3,()).0
cparam(param3).1 1 1 R while_decnz(scratch1,3.param3.inc).0
if_decnz(axiomcode,63).0 0 0 R 3.axiomcode.decnz
if_decnz(axiomcode,63).0 1 1 R if_decnz(axiomcode,63).1
if_decnz(axiomcode,63).1 0 0 R while_decnz(topwff,()).0
if_decnz(axiomcode,63).1 1 1 R while_decnz(scratch1,3.topwff.inc).0
if_eq().n_111.0 0 0 R if_eq().n_111.0.0
if_eq().n_111.0 1 1 R if_eq().n_111.1
if_eq().n_111.0.0 0 0 R 3.scratch2.decnz
if_eq().n_111.0.0 1 1 R if_eq().n_111.0.1
if_eq().n_111.0.1 0 0 R if_eq().n_111.0.1.0
if_eq().n_111.0.1 1 1 R if_eq().n_111.0.2
if_eq().n_111.0.1.0 0 0 R 3.scratch3.decnz
if_eq().n_111.0.1.0 1 0 L 6.continue.1
if_eq().n_111.0.2 0 0 R while_decnz(scratch2,()).0
if_eq().n_111.0.2 1 0 L 6.break.2
if_eq().n_111.1 0 0 R 3.scratch3.decnz
if_eq().n_111.1 1 1 R if_eq().n_111.2
if_eq().n_111.2 0 0 R while_decnz(scratch3,()).0
if_eq().n_111.2 1 0 L 6.break.1
if_eq(scratch2,scratch3,102).0 0 0 R if_eq().n_111.0
if_eq(scratch2,scratch3,102).0 1 1 R if_eq(scratch2,scratch3,102).1
if_eq(scratch2,scratch3,102).1 0 0 R while_decnz(param1,99).0
if_eq(scratch2,scratch3,102).1 1 1 R while_decnz(scratch1,3.param1.inc).0
if_eq(scratch2,scratch3,61).0 0 0 R if_eq().n_111.0
if_eq(scratch2,scratch3,61).0 1 1 R while_decnz(topwff,()).0
if_not_decnz(prooflist,72).0 0 0 R if_not_decnz(prooflist,72).0.0
if_not_decnz(prooflist,72).0 1 1 R if_not_decnz(prooflist,72).1
if_not_decnz(prooflist,72).0.0 0 0 R 3.prooflist.decnz
if_not_decnz(prooflist,72).0.0 1 0 L 6.break.1
if_not_decnz(prooflist,72).1 0 0 R while_decnz(nextproof,67).0
if_not_decnz(prooflist,72).1 1 1 R if_not_decnz(prooflist,72).2
if_not_decnz(prooflist,72).2 0 0 R while_decnz(scratch1,3.nextproof.inc).0
if_not_decnz(prooflist,72).2 1 1 R 3.nextproof.inc
main().0 0 0 R if_not_decnz(prooflist,72).0
main().0 1 1 R main().1
main().1 0 0 R while_decnz(axiomcode,()).0
main().1 1 1 R main().2
main().10 0 0 R while_decnz(scratch1,3.param2.inc).0
main().10 1 1 R main().11
main().100 0 0 R main().n_127.0
main().100 1 1 R main().101
main().101 0 0 R main().n_132.0
main().101 1 1 R main().102
main().102 0 0 R wa().0
main().102 1 1 R main().103
main().103 0 0 R main().n_154.0
main().103 1 1 R main().104
main().104 0 0 R main().n_159.0
main().104 1 1 R main().105
main().105 0 0 R main().n_155.0
main().105 1 1 R main().106
main().106 0 0 R v_3().0
main().106 1 1 R main().107
main().107 0 0 R main().n_156.0
main().107 1 1 R main().108
main().108 0 0 R main().n_133.0
main().108 1 1 R main().109
main().109 0 0 R main().n_158.0
main().109 1 1 R main().110
main().11 0 0 R main().n_149.0
main().11 1 1 R main().12
main().110 0 0 R main().n_128.0
main().110 1 1 R main().111
main().111 0 0 R v_2().0
main().111 1 1 R main().112
main().112 0 0 R main().n_156.0
main().112 1 1 R main().113
main().113 0 0 R v_3().0
main().113 1 1 R main().114
main().114 0 0 R main().n_133.0
main().114 1 1 R main().115
main().115 0 0 R main().n_157.0
main().115 1 1 R main().116
main().116 0 0 R main().n_128.0
main().116 1 1 R main().117
main().117 0 0 R main().n_142.0
main().117 1 1 R main().118
main().118 0 0 R pushwff().0
main().118 1 1 R main().119
main().119 0 0 R main().n_142.0
main().119 1 1 R main().120
main().12 0 0 R while_decnz(scratch1,3.param3.inc).0
main().12 1 1 R main().13
main().120 0 0 R main().n_134.0
main().120 1 1 R main().121
main().121 0 0 R v_1().0
main().121 1 1 R main().122
main().122 0 0 R main().n_155.0
main().122 1 1 R main().123
main().123 0 0 R wel().0
main().123 1 1 R main().124
main().124 0 0 R main().n_143.0
main().124 1 1 R main().125
main().125 0 0 R wim().0
main().125 1 1 R main().126
main().126 0 0 R main().n_143.0
main().126 1 1 R main().127
main().127 0 0 R main().n_155.0
main().127 1 1 R main().128
main().128 0 0 R main().n_135.0
main().128 1 1 R main().129
main().129 0 0 R main().n_157.0
main().129 1 1 R main().130
main().13 0 0 R pushwff().0
main().13 1 1 R main().14
main().130 0 0 R main().n_158.0
main().130 1 1 R main().131
main().131 0 0 R main().n_157.0
main().131 1 1 R main().132
main().132 0 0 R select().0
main().132 1 1 R main().133
main().133 0 0 R 3.topwff.decnz
main().133 1 1 R main().134
main().134 0 0 R main().134.0
main().134 1 1 R halt
main().134.0 0 0 R 3.topwff.decnz
main().134.0 1 1 R main().134.1
main().134.1 0 0 R main().134.1.0
main().134.1 1 0 L 6.break.1
main().134.1.0 0 0 R 3.topwff.inc
main().134.1.0 1 1 R 3.topwff.inc
main().14 0 0 R cparam(param3).0
main().14 1 1 R main().15
main().15 0 0 R cparam(param2).0
main().15 1 1 R main().16
main().16 0 0 R par3().0
main().16 1 1 R main().17
main().17 0 0 R main().n_151.0
main().17 1 1 R main().18
main().18 0 0 R while_decnz(topwff,3.scratch2.inc).0
main().18 1 1 R main().19
main().19 0 0 R while_decnz(param2,96).0
main().19 1 1 R main().20
main().2 0 0 R while_decnz(param1,()).0
main().2 1 1 R main().3
main().20 0 0 R while_decnz(scratch1,3.param2.inc).0
main().20 1 1 R main().21
main().21 0 0 R if_eq(scratch2,scratch3,102).0
main().21 1 1 R main().22
main().22 0 0 R select().0
main().22 1 1 R main().23
main().23 0 0 R cparam(param3).0
main().23 1 1 R main().24
main().24 0 0 R main().n_138.0
main().24 1 1 R main().25
main().25 0 0 R main().n_146.0
main().25 1 1 R main().26
main().26 0 0 R wim().0
main().26 1 1 R main().27
main().27 0 0 R par2().0
main().27 1 1 R main().28
main().28 0 0 R main().n_150.0
main().28 1 1 R main().29
main().29 0 0 R par1().0
main().29 1 1 R main().30
main().3 0 0 R while_decnz(param2,()).0
main().3 1 1 R main().4
main().30 0 0 R main().n_150.0
main().30 1 1 R main().31
main().31 0 0 R main().n_137.0
main().31 1 1 R main().32
main().32 0 0 R wn().0
main().32 1 1 R main().33
main().33 0 0 R main().n_151.0
main().33 1 1 R main().34
main().34 0 0 R par1().0
main().34 1 1 R main().35
main().35 0 0 R main().n_136.0
main().35 1 1 R main().36
main().36 0 0 R wn().0
main().36 1 1 R main().37
main().37 0 0 R par2().0
main().37 1 1 R main().38
main().38 0 0 R main().n_131.0
main().38 1 1 R main().39
main().39 0 0 R main().n_150.0
main().39 1 1 R main().40
main().4 0 0 R while_decnz(param3,()).0
main().4 1 1 R main().5
main().40 0 0 R wal().0
main().40 1 1 R main().41
main().41 0 0 R main().n_160.0
main().41 1 1 R main().42
main().42 0 0 R wal().0
main().42 1 1 R main().43
main().43 0 0 R main().n_138.0
main().43 1 1 R main().44
main().44 0 0 R wim().0
main().44 1 1 R main().45
main().45 0 0 R wim().0
main().45 1 1 R main().46
main().46 0 0 R main().n_126.0
main().46 1 1 R main().47
main().47 0 0 R main().n_125.0
main().47 1 1 R main().48
main().48 0 0 R par2().0
main().48 1 1 R main().49
main().49 0 0 R weq().0
main().49 1 1 R main().50
main().5 0 0 R main().n_149.0
main().5 1 1 R main().6
main().50 0 0 R main().n_152.0
main().50 1 1 R main().51
main().51 0 0 R main().n_139.0
main().51 1 1 R main().52
main().52 0 0 R par3().0
main().52 1 1 R main().53
main().53 0 0 R main().n_139.0
main().53 1 1 R main().54
main().54 0 0 R main().n_152.0
main().54 1 1 R main().55
main().55 0 0 R wa().0
main().55 1 1 R main().56
main().56 0 0 R while_decnz(param1,113).0
main().56 1 1 R main().57
main().57 0 0 R while_decnz(scratch1,3.param1.inc).0
main().57 1 1 R main().58
main().58 0 0 R main().n_140.0
main().58 1 1 R main().59
main().59 0 0 R while_decnz(param2,113).0
main().59 1 1 R main().60
main().6 0 0 R while_decnz(scratch1,3.axiomcode.inc).0
main().6 1 1 R main().7
main().60 0 0 R while_decnz(scratch1,3.param2.inc).0
main().60 1 1 R main().61
main().61 0 0 R main().n_140.0
main().61 1 1 R main().62
main().62 0 0 R main().n_126.0
main().62 1 1 R main().63
main().63 0 0 R main().n_130.0
main().63 1 1 R main().64
main().64 0 0 R main().n_154.0
main().64 1 1 R main().65
main().65 0 0 R par2().0
main().65 1 1 R main().66
main().66 0 0 R main().n_130.0
main().66 1 1 R main().67
main().67 0 0 R weq().0
main().67 1 1 R main().68
main().68 0 0 R wex().0
main().68 1 1 R main().69
main().69 0 0 R main().n_129.0
main().69 1 1 R main().70
main().7 0 0 R main().n_149.0
main().7 1 1 R main().8
main().70 0 0 R weq().0
main().70 1 1 R main().71
main().71 0 0 R main().n_163.0
main().71 1 1 R main().72
main().72 0 0 R main().n_161.0
main().72 1 1 R main().73
main().73 0 0 R main().n_125.0
main().73 1 1 R main().74
main().74 0 0 R wel().0
main().74 1 1 R main().75
main().75 0 0 R par3().0
main().75 1 1 R main().76
main().76 0 0 R par2().0
main().76 1 1 R main().77
main().77 0 0 R wel().0
main().77 1 1 R main().78
main().78 0 0 R main().n_145.0
main().78 1 1 R main().79
main().79 0 0 R v_2().0
main().79 1 1 R main().80
main().8 0 0 R while_decnz(scratch1,3.param1.inc).0
main().8 1 1 R main().9
main().80 0 0 R main().n_153.0
main().80 1 1 R main().81
main().81 0 0 R wel().0
main().81 1 1 R main().82
main().82 0 0 R main().n_132.0
main().82 1 1 R main().83
main().83 0 0 R main().n_144.0
main().83 1 1 R main().84
main().84 0 0 R main().n_153.0
main().84 1 1 R main().85
main().85 0 0 R main().n_135.0
main().85 1 1 R main().86
main().86 0 0 R pushwff().0
main().86 1 1 R main().87
main().87 0 0 R main().n_141.0
main().87 1 1 R main().88
main().88 0 0 R select().0
main().88 1 1 R main().89
main().89 0 0 R v_3().0
main().89 1 1 R main().90
main().9 0 0 R main().n_149.0
main().9 1 1 R main().10
main().90 0 0 R main().n_155.0
main().90 1 1 R main().91
main().91 0 0 R main().n_148.0
main().91 1 1 R main().92
main().92 0 0 R v_2().0
main().92 1 1 R main().93
main().93 0 0 R main().n_141.0
main().93 1 1 R main().94
main().94 0 0 R main().n_154.0
main().94 1 1 R main().95
main().95 0 0 R wal().0
main().95 1 1 R main().96
main().96 0 0 R v_1().0
main().96 1 1 R main().97
main().97 0 0 R main().n_134.0
main().97 1 1 R main().98
main().98 0 0 R main().n_127.0
main().98 1 1 R main().99
main().99 0 0 R wim().0
main().99 1 1 R main().100
main().n_125.0 0 0 R wim().0
main().n_125.0 1 1 R main().n_125.1
main().n_125.1 0 0 R main().n_129.0
main().n_125.1 1 1 R main().n_125.2
main().n_125.2 0 0 R wel().0
main().n_125.2 1 1 R main().n_125.3
main().n_125.3 0 0 R main().n_163.0
main().n_125.3 1 1 R main().n_125.4
main().n_125.4 0 0 R wel().0
main().n_125.4 1 1 R main().n_125.5
main().n_125.5 0 0 R main().n_131.0
main().n_125.5 1 1 R main().n_125.6
main().n_125.6 0 0 R weq().0
main().n_125.6 1 1 R main().n_125.7
main().n_125.7 0 0 R par3().0
main().n_125.7 1 1 R par1().0
main().n_126.0 0 0 R main().n_146.0
main().n_126.0 1 1 R main().n_126.1
main().n_126.1 0 0 R main().n_164.0
main().n_126.1 1 1 R main().n_126.2
main().n_126.2 0 0 R wal().0
main().n_126.2 1 1 R main().n_126.3
main().n_126.3 0 0 R par2().0
main().n_126.3 1 1 R main().n_126.4
main().n_126.4 0 0 R main().n_138.0
main().n_126.4 1 1 R wal().0
main().n_127.0 0 0 R v_3().0
main().n_127.0 1 1 R main().n_127.1
main().n_127.1 0 0 R main().n_147.0
main().n_127.1 1 1 R main().n_127.2
main().n_127.2 0 0 R main().n_148.0
main().n_127.2 1 1 R main().n_157.0
main().n_128.0 0 0 R main().n_132.0
main().n_128.0 1 1 R main().n_128.1
main().n_128.1 0 0 R main().n_154.0
main().n_128.1 1 1 R main().n_128.2
main().n_128.2 0 0 R select().0
main().n_128.2 1 1 R v_1().0
main().n_129.0 0 0 R main().n_146.0
main().n_129.0 1 1 R main().n_129.1
main().n_129.1 0 0 R weq().0
main().n_129.1 1 1 R main().n_129.2
main().n_129.2 0 0 R par1().0
main().n_129.2 1 1 R par3().0
main().n_130.0 0 0 R main().n_136.0
main().n_130.0 1 1 R par2().0
main().n_131.0 0 0 R main().n_137.0
main().n_131.0 1 1 R par2().0
main().n_132.0 0 0 R main().n_144.0
main().n_132.0 1 1 R wim().0
main().n_133.0 0 0 R wel().0
main().n_133.0 1 1 R main().n_147.0
main().n_134.0 0 0 R v_2().0
main().n_134.0 1 1 R main().n_144.0
main().n_135.0 0 0 R wel().0
main().n_135.0 1 1 R main().n_135.1
main().n_135.1 0 0 R wim().0
main().n_135.1 1 1 R main().n_135.2
main().n_135.2 0 0 R wa().0
main().n_135.2 1 1 R wal().0
main().n_136.0 0 0 R main().n_159.0
main().n_136.0 1 1 R main().n_185.0
main().n_137.0 0 0 R main().n_145.0
main().n_137.0 1 1 R par1().0
main().n_138.0 0 0 R par1().0
main().n_138.0 1 1 R main().n_164.0
main().n_139.0 0 0 R main().n_160.0
main().n_139.0 1 1 R wel().0
main().n_140.0 0 0 R while_decnz(param3,96).0
main().n_140.0 1 1 R main().n_140.1
main().n_140.1 0 0 R while_decnz(scratch1,3.param1.inc).0
main().n_140.1 1 1 R if_eq(scratch2,scratch3,61).0
main().n_141.0 0 0 R v_1().0
main().n_141.0 1 1 R main().n_161.0
main().n_142.0 0 0 R pushwff().0
main().n_142.0 1 1 R main().n_162.0
main().n_143.0 0 0 R v_1().0
main().n_143.0 1 1 R main().n_143.1
main().n_143.1 0 0 R pushwff().0
main().n_143.1 1 1 R weq().0
main().n_144.0 0 0 R v_2().0
main().n_144.0 1 1 R main().n_162.0
main().n_145.0 0 0 R wim().0
main().n_145.0 1 1 R main().n_159.0
main().n_146.0 0 0 R select().0
main().n_146.0 1 1 R main().n_160.0
main().n_147.0 0 0 R v_3().0
main().n_147.0 1 1 R main().n_188.0
main().n_148.0 0 0 R v_1().0
main().n_148.0 1 1 R main().n_148.1
main().n_148.1 0 0 R par1().0
main().n_148.1 1 1 R wal().0
main().n_149.0 0 0 R unpair(scratch1,scratch2,prooflist).0
main().n_149.0 1 1 R while_decnz(scratch2,3.prooflist.inc).0
main().n_150.0 0 0 R par3().0
main().n_150.0 1 1 R wim().0
main().n_151.0 0 0 R par1().0
main().n_151.0 1 1 R wim().0
main().n_152.0 0 0 R wal().0
main().n_152.0 1 1 R wim().0
main().n_153.0 0 0 R v_2().0
main().n_153.0 1 1 R pushwff().0
main().n_154.0 0 0 R wal().0
main().n_154.0 1 1 R wex().0
main().n_155.0 0 0 R v_1().0
main().n_155.0 1 1 R v_2().0
main().n_156.0 0 0 R v_3().0
main().n_156.0 1 1 R v_2().0
main().n_157.0 0 0 R wa().0
main().n_157.0 1 1 R wex().0
main().n_158.0 0 0 R wim().0
main().n_158.0 1 1 R wal().0
main().n_159.0 0 0 R wim().0
main().n_159.0 1 1 R select().0
main().n_160.0 0 0 R par1().0
main().n_160.0 1 1 R par2().0
main().n_161.0 0 0 R weq().0
main().n_161.0 1 1 R wim().0
main().n_162.0 0 0 R v_1().0
main().n_162.0 1 1 R wel().0
main().n_163.0 0 0 R par2().0
main().n_163.0 1 1 R par3().0
main().n_164.0 0 0 R par3().0
main().n_164.0 1 1 R wal().0
main().n_185.0 0 0 R par1().0
main().n_185.0 1 1 R par1().0
main().n_188.0 0 0 R pushwff().0
main().n_188.0 1 1 R wel().0
n_165.0 0 0 R unpair(scratch1,scratch2,wffstack).0
n_165.0 1 1 R while_decnz(scratch2,3.wffstack.inc).0
pair(scratch1,topwff,wffstack).0 0 0 R while_decnz(topwff,21).0
pair(scratch1,topwff,wffstack).0 1 1 R pair(scratch1,topwff,wffstack).1
pair(scratch1,topwff,wffstack).1 0 0 R 3.wffstack.decnz
pair(scratch1,topwff,wffstack).1 1 1 R pair(scratch1,topwff,wffstack).2
pair(scratch1,topwff,wffstack).2 0 0 R pair(scratch1,topwff,wffstack).2.0
pair(scratch1,topwff,wffstack).2 1 0 L 6.continue.2
pair(scratch1,topwff,wffstack).2.0 0 0 R 3.scratch1.inc
pair(scratch1,topwff,wffstack).2.0 1 1 R while_decnz(wffstack,3.topwff.inc).0
pair(scratch2,scratch1,topwff).0 0 0 R while_decnz(scratch1,9).0
pair(scratch2,scratch1,topwff).0 1 1 R pair(scratch2,scratch1,topwff).1
pair(scratch2,scratch1,topwff).1 0 0 R 3.topwff.decnz
pair(scratch2,scratch1,topwff).1 1 1 R pair(scratch2,scratch1,topwff).2
pair(scratch2,scratch1,topwff).2 0 0 R pair(scratch2,scratch1,topwff).2.0
pair(scratch2,scratch1,topwff).2 1 0 L 6.continue.2
pair(scratch2,scratch1,topwff).2.0 0 0 R 3.scratch2.inc
pair(scratch2,scratch1,topwff).2.0 1 1 R while_decnz(topwff,3.scratch1.inc).0
par1().0 0 0 R pushwff().0
par1().0 1 1 R par1().1
par1().1 0 0 R while_decnz(param1,42).0
par1().1 1 1 R while_decnz(scratch1,3.param1.inc).0
par2().0 0 0 R pushwff().0
par2().0 1 1 R par2().1
par2().1 0 0 R while_decnz(param2,42).0
par2().1 1 1 R while_decnz(scratch1,3.param2.inc).0
par3().0 0 0 R pushwff().0
par3().0 1 1 R par3().1
par3().1 0 0 R while_decnz(param3,42).0
par3().1 1 1 R while_decnz(scratch1,3.param3.inc).0
pushwff().0 0 0 R pair(scratch1,topwff,wffstack).0
pushwff().0 1 1 R while_decnz(scratch1,3.wffstack.inc).0
select().0 0 0 R while_decnz(topwff,3.scratch1.inc).0
select().0 1 1 R select().1
select().1 0 0 R unpair(topwff,scratch2,wffstack).0
select().1 1 1 R select().2
select().2 0 0 R while_decnz(scratch2,3.wffstack.inc).0
select().2 1 1 R select().3
select().3 0 0 R if_decnz(axiomcode,63).0
select().3 1 1 R while_decnz(scratch1,()).0
unpair().n_2.0 0 0 R 3.scratch2.decnz
unpair().n_2.0 1 0 L 6.continue.2
unpair().n_5.0 0 0 R 3.scratch1.inc
unpair().n_5.0 1 1 R unpair().n_5.1
unpair().n_5.1 0 0 R unpair().n_2.0
unpair().n_5.1 1 1 R unpair().n_5.2
unpair().n_5.2 0 0 R while_decnz(scratch1,3.scratch2.inc).0
unpair().n_5.2 1 0 L 6.continue.3
unpair(scratch1,scratch2,prooflist).0 0 0 R 3.prooflist.decnz
unpair(scratch1,scratch2,prooflist).0 1 1 R unpair().n_5.0
unpair(scratch1,scratch2,wffstack).0 0 0 R 3.wffstack.decnz
unpair(scratch1,scratch2,wffstack).0 1 1 R unpair().n_5.0
unpair(topwff,scratch2,wffstack).0 0 0 R 3.wffstack.decnz
unpair(topwff,scratch2,wffstack).0 1 1 R unpair(topwff,scratch2,wffstack).1
unpair(topwff,scratch2,wffstack).1 0 0 R 3.topwff.inc
unpair(topwff,scratch2,wffstack).1 1 1 R unpair(topwff,scratch2,wffstack).2
unpair(topwff,scratch2,wffstack).2 0 0 R unpair().n_2.0
unpair(topwff,scratch2,wffstack).2 1 1 R unpair(topwff,scratch2,wffstack).3
unpair(topwff,scratch2,wffstack).3 0 0 R while_decnz(topwff,3.scratch2.inc).0
unpair(topwff,scratch2,wffstack).3 1 0 L 6.continue.3
v_1().0 0 0 R pushwff().0
v_1().0 1 1 R 3.topwff.inc
v_2().0 0 0 R v_1().0
v_2().0 1 1 R 3.topwff.inc
v_3().0 0 0 R v_2().0
v_3().0 1 1 R 3.topwff.inc
v_4().0 0 0 R v_3().0
v_4().0 1 1 R 3.topwff.inc
wa().0 0 0 R wn().0
wa().0 1 1 R wa().1
wa().1 0 0 R wim().0
wa().1 1 1 R wn().0
wal().0 0 0 R cons().0
wal().0 1 1 R wal().1
wal().1 0 0 R v_4().0
wal().1 1 1 R cons().0
wel().0 0 0 R cons().0
wel().0 1 1 R wel().1
wel().1 0 0 R v_1().0
wel().1 1 1 R cons().0
weq().0 0 0 R cons().0
weq().0 1 1 R weq().1
weq().1 0 0 R pushwff().0
weq().1 1 1 R cons().0
wex().0 0 0 R wn().0
wex().0 1 1 R wex().1
wex().1 0 0 R wal().0
wex().1 1 1 R wn().0
while_decnz().n_0.0 0 0 R 3.scratch2.inc
while_decnz().n_0.0 1 0 L 6.continue.1
while_decnz().n_114.0 0 0 R while_decnz().n_114.0.0
while_decnz().n_114.0 1 0 L 6.continue.1
while_decnz().n_114.0.0 0 0 R 3.scratch1.inc
while_decnz().n_114.0.0 1 1 R 3.scratch2.inc
while_decnz().n_18.0 0 0 R 3.topwff.inc
while_decnz().n_18.0 1 0 L 6.continue.1
while_decnz().n_43.0 0 0 R while_decnz().n_43.0.0
while_decnz().n_43.0 1 0 L 6.continue.1
while_decnz().n_43.0.0 0 0 R 3.topwff.inc
while_decnz().n_43.0.0 1 1 R 3.scratch1.inc
while_decnz().n_7.0 0 0 R 3.wffstack.inc
while_decnz().n_7.0 1 0 L 6.continue.1
while_decnz().n_97.0 0 0 R while_decnz().n_97.0.0
while_decnz().n_97.0 1 0 L 6.continue.1
while_decnz().n_97.0.0 0 0 R 3.scratch1.inc
while_decnz().n_97.0.0 1 1 R 3.scratch3.inc
while_decnz(axiomcode,()).0 0 0 R 3.axiomcode.decnz
while_decnz(axiomcode,()).0 1 0 L 6.continue.0
while_decnz(nextproof,67).0 0 0 R 3.nextproof.decnz
while_decnz(nextproof,67).0 1 1 R while_decnz(nextproof,67).1
while_decnz(nextproof,67).1 0 0 R while_decnz(nextproof,67).1.0
while_decnz(nextproof,67).1 1 0 L 6.continue.1
while_decnz(nextproof,67).1.0 0 0 R 3.scratch1.inc
while_decnz(nextproof,67).1.0 1 1 R 3.prooflist.inc
while_decnz(param1,()).0 0 0 R 3.param1.decnz
while_decnz(param1,()).0 1 0 L 6.continue.0
while_decnz(param1,113).0 0 0 R 3.param1.decnz
while_decnz(param1,113).0 1 1 R while_decnz().n_114.0
while_decnz(param1,42).0 0 0 R 3.param1.decnz
while_decnz(param1,42).0 1 1 R while_decnz().n_43.0
while_decnz(param1,99).0 0 0 R 3.param1.decnz
while_decnz(param1,99).0 1 1 R while_decnz(param1,99).1
while_decnz(param1,99).1 0 0 R while_decnz(param1,99).1.0
while_decnz(param1,99).1 1 0 L 6.continue.1
while_decnz(param1,99).1.0 0 0 R 3.scratch1.inc
while_decnz(param1,99).1.0 1 1 R 3.topwff.inc
while_decnz(param2,()).0 0 0 R 3.param2.decnz
while_decnz(param2,()).0 1 0 L 6.continue.0
while_decnz(param2,113).0 0 0 R 3.param2.decnz
while_decnz(param2,113).0 1 1 R while_decnz().n_114.0
while_decnz(param2,42).0 0 0 R 3.param2.decnz
while_decnz(param2,42).0 1 1 R while_decnz().n_43.0
while_decnz(param2,96).0 0 0 R 3.param2.decnz
while_decnz(param2,96).0 1 1 R while_decnz().n_97.0
while_decnz(param3,()).0 0 0 R 3.param3.decnz
while_decnz(param3,()).0 1 0 L 6.continue.0
while_decnz(param3,42).0 0 0 R 3.param3.decnz
while_decnz(param3,42).0 1 1 R while_decnz().n_43.0
while_decnz(param3,96).0 0 0 R 3.param3.decnz
while_decnz(param3,96).0 1 1 R while_decnz().n_97.0
while_decnz(scratch1,()).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,()).0 1 0 L 6.continue.0
while_decnz(scratch1,3.axiomcode.inc).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,3.axiomcode.inc).0 1 1 R while_decnz(scratch1,3.axiomcode.inc).1
while_decnz(scratch1,3.axiomcode.inc).1 0 0 R 3.axiomcode.inc
while_decnz(scratch1,3.axiomcode.inc).1 1 0 L 6.continue.1
while_decnz(scratch1,3.nextproof.inc).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,3.nextproof.inc).0 1 1 R while_decnz(scratch1,3.nextproof.inc).1
while_decnz(scratch1,3.nextproof.inc).1 0 0 R 3.nextproof.inc
while_decnz(scratch1,3.nextproof.inc).1 1 0 L 6.continue.1
while_decnz(scratch1,3.param1.inc).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,3.param1.inc).0 1 1 R while_decnz(scratch1,3.param1.inc).1
while_decnz(scratch1,3.param1.inc).1 0 0 R 3.param1.inc
while_decnz(scratch1,3.param1.inc).1 1 0 L 6.continue.1
while_decnz(scratch1,3.param2.inc).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,3.param2.inc).0 1 1 R while_decnz(scratch1,3.param2.inc).1
while_decnz(scratch1,3.param2.inc).1 0 0 R 3.param2.inc
while_decnz(scratch1,3.param2.inc).1 1 0 L 6.continue.1
while_decnz(scratch1,3.param3.inc).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,3.param3.inc).0 1 1 R while_decnz(scratch1,3.param3.inc).1
while_decnz(scratch1,3.param3.inc).1 0 0 R 3.param3.inc
while_decnz(scratch1,3.param3.inc).1 1 0 L 6.continue.1
while_decnz(scratch1,3.scratch2.inc).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,3.scratch2.inc).0 1 1 R while_decnz().n_0.0
while_decnz(scratch1,3.topwff.inc).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,3.topwff.inc).0 1 1 R while_decnz().n_18.0
while_decnz(scratch1,3.wffstack.inc).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,3.wffstack.inc).0 1 1 R while_decnz().n_7.0
while_decnz(scratch1,9).0 0 0 R 3.scratch1.decnz
while_decnz(scratch1,9).0 1 1 R while_decnz(scratch1,9).1
while_decnz(scratch1,9).1 0 0 R while_decnz(scratch1,9).1.0
while_decnz(scratch1,9).1 1 0 L 6.continue.1
while_decnz(scratch1,9).1.0 0 0 R 3.topwff.inc
while_decnz(scratch1,9).1.0 1 1 R 3.scratch2.inc
while_decnz(scratch2,()).0 0 0 R 3.scratch2.decnz
while_decnz(scratch2,()).0 1 0 L 6.continue.0
while_decnz(scratch2,3.prooflist.inc).0 0 0 R 3.scratch2.decnz
while_decnz(scratch2,3.prooflist.inc).0 1 1 R while_decnz(scratch2,3.prooflist.inc).1
while_decnz(scratch2,3.prooflist.inc).1 0 0 R 3.prooflist.inc
while_decnz(scratch2,3.prooflist.inc).1 1 0 L 6.continue.1
while_decnz(scratch2,3.topwff.inc).0 0 0 R 3.scratch2.decnz
while_decnz(scratch2,3.topwff.inc).0 1 1 R while_decnz().n_18.0
while_decnz(scratch2,3.wffstack.inc).0 0 0 R 3.scratch2.decnz
while_decnz(scratch2,3.wffstack.inc).0 1 1 R while_decnz().n_7.0
while_decnz(scratch3,()).0 0 0 R 3.scratch3.decnz
while_decnz(scratch3,()).0 1 0 L 6.continue.0
while_decnz(topwff,()).0 0 0 R 3.topwff.decnz
while_decnz(topwff,()).0 1 0 L 6.continue.0
while_decnz(topwff,21).0 0 0 R 3.topwff.decnz
while_decnz(topwff,21).0 1 1 R while_decnz(topwff,21).1
while_decnz(topwff,21).1 0 0 R while_decnz(topwff,21).1.0
while_decnz(topwff,21).1 1 0 L 6.continue.1
while_decnz(topwff,21).1.0 0 0 R 3.wffstack.inc
while_decnz(topwff,21).1.0 1 1 R 3.scratch1.inc
while_decnz(topwff,3.scratch1.inc).0 0 0 R 3.topwff.decnz
while_decnz(topwff,3.scratch1.inc).0 1 1 R while_decnz(topwff,3.scratch1.inc).1
while_decnz(topwff,3.scratch1.inc).1 0 0 R 3.scratch1.inc
while_decnz(topwff,3.scratch1.inc).1 1 0 L 6.continue.1
while_decnz(topwff,3.scratch2.inc).0 0 0 R 3.topwff.decnz
while_decnz(topwff,3.scratch2.inc).0 1 1 R while_decnz().n_0.0
while_decnz(wffstack,3.topwff.inc).0 0 0 R 3.wffstack.decnz
while_decnz(wffstack,3.topwff.inc).0 1 1 R while_decnz().n_18.0
wim().0 0 0 R cons().0
wim().0 1 1 R wim().1
wim().1 0 0 R v_2().0
wim().1 1 1 R cons().0
wn().0 0 0 R v_3().0
wn().0 1 1 R cons().0
