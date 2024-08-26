
#let stat20handout(
  title: none,
  title-prefix: none,
  course-name: none,
  semester: none,
  cols: 1,
  margin: (x: 1in, bottom: 1in, top: 1in),
  paper: "us-letter",
  font: (),
  fontsize: 11pt,
  sectionnumbering: none,
  doc,
) = {

  set page(
    paper: paper,
    margin: margin,
    header: underline(offset: 5pt, smallcaps(
      context {
        let delimer = if title-prefix == none {
            none
          } else {
            str(":")
          };

        if counter(page).get().first() == 1 [
          #set text(12pt)
          #title-prefix#delimer #title
          #h(1fr)
          Names:
          #h(150pt)
          ]
        })),
    header-ascent: 40%,
    footer: align(center, smallcaps([
     #course-name #semester
    ]))
  )

  set par(justify: true,
           leading: .7em)

  set text(font: font,
           size: fontsize)

  set heading(numbering: sectionnumbering)

  if cols == 1 {
    doc
  } else {
    columns(cols, doc)
  }

}
