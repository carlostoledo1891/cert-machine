# macOS (clang, libdispatch).  The verifiers are built with strict floating point
# so that the rounding mode they set is honoured.
CC = clang
CFLAGS = -O3 -march=native
STRICT = -O2 -ffp-model=strict -march=native

all: lcs_upper lcs_upper_big lcs_compact lcs_compact_f32 verify_cert verify_cert_stream

lcs_upper: src/lcs_upper.c
	$(CC) $(CFLAGS) -o $@ $< -lm
lcs_upper_big: src/lcs_upper_big.c
	$(CC) $(CFLAGS) -o $@ $< -lm
lcs_compact: src/lcs_compact.c
	$(CC) $(CFLAGS) -o $@ $< -lm
lcs_compact_f32: src/lcs_compact_f32.c
	$(CC) $(CFLAGS) -o $@ $< -lm
verify_cert: src/verify_cert.c
	$(CC) $(STRICT) -o $@ $< -lm
verify_cert_stream: src/verify_cert_stream.c
	$(CC) $(STRICT) -o $@ $< -lm

clean:
	rm -f lcs_upper lcs_upper_big lcs_compact lcs_compact_f32 verify_cert verify_cert_stream
