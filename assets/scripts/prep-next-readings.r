# render pdfs in the future

#=================================#
# extract auto-publish parameters #
#=================================#

# read in course settings
course_settings <- yaml::read_yaml("_course-settings.yml")

timezone <- course_settings$`auto-publish`$timezone
live_as_of <- course_settings$`auto-publish`$`live-as-of`

live_date <- if (live_as_of == "Sys.time()") {
  lubridate::with_tz(time = eval(parse(text = live_as_of)), 
                     tz = timezone) 
} else {
  lubridate::mdy(live_as_of, tz = timezone)
}

#=============================#
# get list of notes to render #
#=============================#

# load utility functions
detect_notes <- function(x) {
  if (exists("href", where = x)) {
    stringr::str_ends(x$href, "notes.qmd")
  } else {
    FALSE
  }
}

get_notes <- function(x) {
  is_notes <- purrr::map_lgl(x, detect_notes)
  x$contents[!is_notes] <- NULL
  x
}

# get list of notes
materials_list <- course_settings$schedule |>
  purrr::map("materials") |>
  purrr::list_flatten() 

is_notes <- materials_list |>
  purrr::map(detect_notes) |>
  purrr::flatten_lgl()

notes_list <- materials_list |>
  purrr::keep(is_notes)


#=====================#
# find upcoming notes #
#=====================#

is_not_live <- function(x, live_date, timezone) { # load utility function
  if(!exists("date", where = x)) {stop("Item in schedule lacks date field.")}
  file_date <- lubridate::mdy(x$date, tz = timezone)
  
  if (file_date > live_date) {x} else {NULL}
}

next_notes <- purrr::map(notes_list, 
                         is_not_live, 
                         live_date = live_date,
                         timezone = timezone) |>
  purrr::discard(is.null) |>
  head(n = 2)


#=====================#
# render notes to pdf #
#=====================#

paste(next_notes)

render_pdf <- function(x) {
  quarto::check()
  quarto::quarto_render(x, output_format = "pdf", debug = TRUE)
}

purrr::walk(purrr::map(next_notes, "href"), render_pdf)

# a <- unlist(purrr::map(next_notes, "href"))
# 
# quarto::quarto_render(a[1], output_format = "pdf")
# quarto::quarto_render(a[2], output_format = "pdf")


#================#
# write pdfs.yml #
#================#

make_title <- function(x) {
  if(!exists("title", where = x)) {
    rmarkdown::yaml_front_matter(x$href)$title
  } else {
    x$title
  }
}

update_title <- function(x) {
  purrr::list_modify(x, title = make_title(x))
}

update_href <- function(x) {
  purrr::list_modify(x, href = stringr::str_replace(x$href, ".qmd", ".pdf"))
}

reading_list <- next_notes |>
  purrr::map(update_title) |>
  purrr::map(update_href)

# write file
yaml::write_yaml(reading_list, "assets/items.yml")

cli::cli_alert_success("PDFs of {unlist(purrr::map(reading_list, 'title'))} now available on home page.")

