/* eqcert — a certification toolkit for equilibrium computations.

   Not a solver, and deliberately not a modelling framework: the models here
   (finite-difference MFG, spectral MFG, Wardrop flows on networks, exact
   dynamic programs) share almost no structure and unifying them would make
   each one harder to verify. What they DO share is the last step — turning a
   computed equilibrium into a claim somebody else can check — and that is all
   this package contains.

     certificate  what a certificate is, made structural: the constructor
                  refuses to build one without a falsifier
     interval     outward-rounded interval arithmetic (bounds what you cannot
                  compute exactly)
     transcendental  sound interval exp / log / sin / cos / tanh (see tests)
     rational     exact BigInt fractions (DECIDES; the only tool that can
                  resolve a tie)
     sequence     weighted ell^1_nu algebra with explicit parity
     radii        the radii polynomial and the Krawczyk operator, with their
                  side conditions enforced rather than documented

   MIT licensed. */
'use strict';
module.exports = {
  certificate: require('./certificate.js'),
  interval: require('./interval.js'),
  transcendental: require('./transcendental.js'),
  rational: require('./rational.js'),
  sequence: require('./sequence.js'),
  radii: require('./radii.js')
};
