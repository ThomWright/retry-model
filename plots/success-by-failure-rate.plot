set terminal png size 650,500 font "sans,14";

set border 3
set key tmargin

set xlabel "Failure rate (%)"
set ylabel "Availability (%)"
set y2label "Improvement (% points)"

set xtics nomirror
set ytics nomirror

set grid xtics ytics

# set xrange [0:50]

set style fill solid 1.0 noborder
set linetype 1 linecolor rgb '#477dca' linewidth 2
set linetype 2 linewidth 2

plot 'tmp/data.dat' using 3:9 title "Availability" with lines, \
     ''             using 3:($9-(100-$3)) title "Improvement" with lines
