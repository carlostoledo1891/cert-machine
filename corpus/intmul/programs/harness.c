/* harness.c — the release's own C file, unmodified, with OUR main: two operands read from hexadecimal files, the
   release's end-to-end multiply called on them, the product written out in hexadecimal. Nothing here compares. */
#define main release_main
#include "intmul_fastdft.c"
#undef main
int main(int argc, char **argv) {
  if (argc != 6) { fprintf(stderr, "usage: harness <algo 0|1> <a.hex> <b.hex> <out.hex> <nbits>\n"); return 2; }
  g_sinc = atoi(argv[1]);
  mpz_t A, B, res; mpz_inits(A, B, res, NULL);
  FILE *f = fopen(argv[2], "r"); if (!f || !mpz_inp_str(A, f, 16)) return 3; fclose(f);
  f = fopen(argv[3], "r"); if (!f || !mpz_inp_str(B, f, 16)) return 3; fclose(f);
  MulStats st;
  int ok = multiply_e2e(A, B, atol(argv[5]), 0, res, &st);
  f = fopen(argv[4], "w"); if (!f) return 4; mpz_out_str(f, 16, res); fclose(f);
  printf("release_check=%s core_s=%.2f total_s=%.2f\n", ok ? "EXACT MATCH" : "MISMATCH", st.t_fast, st.t_total);
  return 0;
}
