
#show: doc => stat20handout(
$if(title)$
  title: [$title$],
$endif$
$if(title-prefix)$
  title-prefix: [$title-prefix$],
$endif$
$if(course-name)$
  course-name: [$course-name$],
$endif$
$if(semester)$
  semester: [$semester$],
$endif$
$if(date)$
  date: [$date$],
$endif$
$if(margin)$
  margin: ($for(margin/pairs)$$margin.key$: $margin.value$,$endfor$),
$endif$
$if(paper)$
  paper: ("$papersize$",),
$endif$
$if(mainfont)$
  font: ("$mainfont$",),
$endif$
$if(fontsize)$
  fontsize: $fontsize$,
$endif$
$if(section-numbering)$
  sectionnumbering: "$section-numbering$",
$endif$
  cols: $if(columns)$$columns$$else$1$endif$,
  doc,
)
