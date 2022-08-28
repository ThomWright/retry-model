set terminal png

set border 3
set key off

set xlabel "Failure rate (%)"
set ylabel "Load (reqs)"

set xtics nomirror
set ytics nomirror

set yrange [0:]

set style fill solid 1.0 noborder
set linetype 1 linecolor rgb '#477dca' linewidth 2

plot 'tmp/data.dat' using 3:10 with lines