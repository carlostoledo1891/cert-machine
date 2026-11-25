source /opt/omega/p1x.sh
install -o $U -g $U -m 644 /opt/omega/T2_AlphaOrientation_r1.lean $A/T2_AlphaOrientation_r1.lean
sha256sum $A/T2_AlphaOrientation_r1.lean > $R/XT2r1-file.sha256
diff $RT/T2_AlphaOrientation.lean $A/T2_AlphaOrientation_r1.lean > $R/XT2r1.diff
step XT2r1 3600 $W lake env lean $A/T2_AlphaOrientation_r1.lean
ok3 XT2r1 $A/T2_AlphaOrientation_r1.lean && log "F4 T2_AlphaOrientation (repair r1, D5): GREEN ($(sort -u $R/XT2r1.axioms | tr '\n' ' '))" || log "F4 T2_AlphaOrientation (repair r1, D5): NOT green (exit $(ex XT2r1); $(grep -hE 'error|declaration uses' $R/XT2r1.out $R/XT2r1.err | head -2 | cut -c1-200 | tr '\n' ' '))"
