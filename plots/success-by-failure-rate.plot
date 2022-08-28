set terminal png

set border 3
set key tmargin

set xlabel "Failure rate (%)"
set ylabel "Success (%)"
set y2label "Difference (% points)"

set xtics nomirror
set ytics nomirror
set y2tics

set grid xtics noytics y2tics

set xrange [0:50]

set style fill solid 1.0 noborder
set linetype 1 linecolor rgb '#477dca' linewidth 2
set linetype 2 linewidth 2

plot 'tmp/data.dat' using 3:9 title "Success" with lines, \
     ''             using 3:($9-(100-$3)) title "Improvement" axes x1y2 with lines
