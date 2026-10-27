# ITF1788 – Interval Test Framework for IEEE Std 1788-2015

* Create portable unit tests in an easy domain specific language
* Share unit tests between several (compatible) libraries
* Extend with plugins for additional interval arithmetic libraries


## Overview

This framework can compile unit tests for a wide range of interval arithmetic libraries. Test cases can be written in a simple domain-specific language using polish prefix notation and interval literals. This way unit tests must not be written separately over and over again, but can be shared between libraries (where semantics and data types would allow it).

To give an example, the following simple unit test is compiled for several interval arithmetic libraries.
```javascript
testcase example {
	disjoint [3.0, 4.0] [1.0, 2.0] = true;
}
```

### C++: libieep1788
https://github.com/nehmeier/libieeep1788
```c++
template<typename T>
using I = p1788::infsup::interval<T, p1788::flavor::infsup::setbased::mpfr_bin_ieee754_flavor>;

BOOST_AUTO_TESTCASE(EXAMPLE)
{
	BOOST_CHECK(disjoint(I<double>(3.0, 4.0), I<double>(1.0, 2.0)));
}
```

### GNU Octave: interval package
https://octave.sourceforge.io/interval/
```octave
## example

%!test
%! assert (disjoint (infsup (3.0, 4.0), infsup (1.0, 2.0)));
```

### Julia: ValidatedNumerics
https://github.com/JuliaIntervals/IntervalArithmetic.jl/  
*Note: IntervalArithmetic.jl is not conforming to IEEE Std 1788-2015 yet, but development is on its way.*
```julia
using IntervalArithmetic
using Base.Test

@testset "example" begin
    @test isdisjoint(Interval(3.0, 4.0), Interval(1.0, 2.0))
end
```

### C++: Gaol
https://sourceforge.net/projects/gaol/  
*Note: Gaol is not fully conforming to IEEE Std 1788-2015. It does not support decorated intervals.*
```c++
using namespace gaol;

BOOST_AUTO_TESTCASE(EXAMPLE)
{
	BOOST_CHECK(interval(3.0, 4.0).set_disjoint(interval(1.0, 2.0)));
}
```

### Python: pyIbex
https://github.com/benEnsta/pyIbex  
*Note: pyIbex is not fully conforming to IEEE Std 1788-2015. It does not support decorated intervals.*
```python
import unittest
import pyIbex
from pyIbex import Interval

class TestCase_example(unittest.TestCase):
    def test_1(self):
       self.assertTrue(Interval(3.0, 4.0).is_disjoint(Interval(1.0, 2.0)))
```

### C++: C-XSC
http://www2.math.uni-wuppertal.de/~xsc/xsc/cxsc/  
*Note: C-XSC is not conforming to IEEE Std 1788-2015. It does not support decorated intervals. Empty intervals trigger an exception, which renders such tests useless. Several standard functions are not supported.*
```c++
using namespace cxsc;

BOOST_AUTO_TESTCASE(EXAMPLE)
{
	BOOST_CHECK(Disjoint(interval(3.0, 4.0), interval(1.0, 2.0)));
}
```

### C++: Ibex
http://www.ibex-lib.org/  
*Note: Ibex is not fully conforming to IEEE Std 1788-2015. It does not support decorated intervals.*
```c++
using namespace ibex;

BOOST_AUTO_TESTCASE(EXAMPLE)
{
	BOOST_CHECK(Interval(3.0, 4.0).is_disjoint(Interval(1.0, 2.0)));
}
```

### GNU Octave: INTLAB toolbox
http://www.ti3.tu-harburg.de/rump/intlab/  
*Note: INTLAB is not conforming to IEEE Std 1788-2015. It does not support decorated or empty intervals. Several standard functions are not supported.*
```octave
## example

%!test
%! assert (emptyintersect (infsup (3.0, 4.0), infsup (1.0, 2.0)));
```


## ITL – Interval Test Libraries

The itl subfolder contains several interval arithmetic unit tests from various libraries, which are based on intervals with boundaries of type binary64.  If you are interested in sharing test libraries, please provide them as a pull request.

Function names are based on IEEE Std 1788-2015, IEEE standard for interval arithmetic, and support for more functions can easily be added in plugins (see below). Operands and results are either intervals, numbers, boolean values or arrays. Intervals may be given in hexadecimal notation. Both, bare and decorated intervals are supported.

Simple test cases use a syntax of the type `function and operands = expected result`. Advanced test cases can be written as `function and operands = tight result <= accurate result`, where a tight result would be desired, but it suffices if the actual result is included in a wider, still accurate result.  Tests for IEEE Std 1788-2015 exceptions can be written as `function and operands = expected result signal expected exception`.

For details read
> M. Kiesner, M. Nehmeier, J. Wolff von Gudenberg (2015). “ITF1788: An Interval Testframework for IEEE 1788.” https://se2.informatik.uni-wuerzburg.de/publications/tr495.pdf


## Plugins

Support for programming languages, test frameworks and interval arithmetic libraries is added via plugins. The src/plugin subfolder already contains support for some and more can be added using the template yaml files.

Plugins are independent of each other and are subdivided into (1) programming language, (2) testing framework and (3) interval arithmetic library. So, if you want to add support for another C++ interval library, you only need to customize the library's part, that is how constructors and arithmetic functions are used.


## Usage

For global installation: Use `python3 setup.py install` (probably requires root privileges). Alternatively, add the project workspace to the environment variable `PYTHONPATH`.

Then you can use `python3 -m itf1788 --help` to show the list of available options and usage examples.
