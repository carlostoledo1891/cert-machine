"""pklread.py — read a pickle WITHOUT unpickling it.

A pickle is a program for a stack machine, and pickle.load runs it: any GLOBAL it names is imported
and any REDUCE calls it. That is why this lab never unpickles a claimant's file. But the program
can be READ: pickletools.genops parses the opcode stream and executes nothing. This module walks
those opcodes over an inert stack, for a short whitelist of opcodes, and returns plain data in
which every GLOBAL is a Ref(module, name) and every REDUCE is a Call(ref, args) — names and
arguments, never imported, never called. Any opcode outside the whitelist refuses the file.

What the caller then accepts is its own decision: claims.py accepts Call(Ref('fractions',
'Fraction'), (str,)) only when the string is a plain integer ratio it parses itself, and a numpy
array only as raw little-endian int64 bytes it decodes itself.
"""
import pickletools


class Ref:
    def __init__(self, module, name):
        self.module, self.name = module, name

    def __repr__(self):
        return 'Ref(%s.%s)' % (self.module, self.name)


class Call:
    def __init__(self, func, args):
        self.func, self.args = func, args
        self.state = None

    def __repr__(self):
        return 'Call(%r, %d args)' % (self.func, len(self.args))


class Mark:
    pass


WHITELIST = {
    'PROTO', 'FRAME', 'STOP', 'MARK', 'EMPTY_DICT', 'EMPTY_LIST', 'EMPTY_TUPLE', 'MEMOIZE', 'BINGET', 'LONG_BINGET',
    'BINPUT', 'LONG_BINPUT', 'SHORT_BINUNICODE', 'BINUNICODE', 'BININT', 'BININT1', 'BININT2', 'LONG1',
    'TUPLE', 'TUPLE1', 'TUPLE2', 'TUPLE3', 'APPEND', 'APPENDS', 'SETITEM', 'SETITEMS', 'NONE', 'NEWTRUE', 'NEWFALSE',
    'SHORT_BINBYTES', 'BINBYTES', 'STACK_GLOBAL', 'REDUCE', 'BUILD', 'BINFLOAT',
}


def read(raw):
    stack, memo, ops = [], {}, 0

    def pop_mark():
        k = len(stack) - 1
        while not isinstance(stack[k], Mark):
            k -= 1
        items = stack[k + 1:]
        del stack[k:]
        return items

    for op, arg, pos in pickletools.genops(raw):
        ops += 1
        name = op.name
        if name not in WHITELIST:
            raise ValueError('pklread: opcode %s at byte %d is outside the whitelist; refusing the file' % (name, pos))
        if name in ('PROTO', 'FRAME'):
            continue
        if name == 'STOP':
            if len(stack) != 1:
                raise ValueError('pklread: stack not singular at STOP')
            return stack[0], ops
        if name == 'MARK':
            stack.append(Mark())
        elif name == 'EMPTY_DICT':
            stack.append({})
        elif name == 'EMPTY_LIST':
            stack.append([])
        elif name == 'EMPTY_TUPLE':
            stack.append(())
        elif name == 'MEMOIZE':
            memo[len(memo)] = stack[-1]
        elif name in ('BINPUT', 'LONG_BINPUT'):
            memo[arg] = stack[-1]
        elif name in ('BINGET', 'LONG_BINGET'):
            stack.append(memo[arg])
        elif name in ('SHORT_BINUNICODE', 'BINUNICODE', 'BININT', 'BININT1', 'BININT2', 'LONG1', 'SHORT_BINBYTES', 'BINBYTES', 'BINFLOAT'):
            stack.append(arg)
        elif name == 'NONE':
            stack.append(None)
        elif name == 'NEWTRUE':
            stack.append(True)
        elif name == 'NEWFALSE':
            stack.append(False)
        elif name == 'TUPLE':
            stack.append(tuple(pop_mark()))
        elif name in ('TUPLE1', 'TUPLE2', 'TUPLE3'):
            k = int(name[-1])
            items = tuple(stack[-k:])
            del stack[-k:]
            stack.append(items)
        elif name == 'APPEND':
            v = stack.pop()
            stack[-1].append(v)
        elif name == 'APPENDS':
            items = pop_mark()
            stack[-1].extend(items)
        elif name == 'SETITEM':
            v = stack.pop(); k = stack.pop()
            stack[-1][k] = v
        elif name == 'SETITEMS':
            items = pop_mark()
            for k in range(0, len(items), 2):
                stack[-1][items[k]] = items[k + 1]
        elif name == 'STACK_GLOBAL':
            nm = stack.pop(); mod = stack.pop()
            if not (isinstance(mod, str) and isinstance(nm, str)):
                raise ValueError('pklread: STACK_GLOBAL with non-string names')
            stack.append(Ref(mod, nm))
        elif name == 'REDUCE':
            args = stack.pop(); func = stack.pop()
            if not isinstance(func, Ref) or not isinstance(args, tuple):
                raise ValueError('pklread: REDUCE of a non-reference')
            stack.append(Call(func, args))
        elif name == 'BUILD':
            state = stack.pop()
            obj = stack[-1]
            if not isinstance(obj, Call):
                raise ValueError('pklread: BUILD on a non-call')
            obj.state = state
    raise ValueError('pklread: no STOP opcode')
