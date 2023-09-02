# Provide pdf of notes on homepage for preview

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

preview_pdf_list <- course_settings$`auto-publish`$`preview-pdf`


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
# add preview windows #
#=====================#

add_preview_window <- function(x, preview_pdf_list, timezone) {
  if(!exists("date", where = x)) {stop("Note in course-settings lacks date field.")}
  notes_datetime <- lubridate::mdy(x$date, tz = timezone)
  for (i in seq_along(preview_pdf_list)) {
    if(lubridate::wday(notes_datetime, label = TRUE) == preview_pdf_list[[i]]$`day-of-notes`) {
      x$on_homepage_from <- notes_datetime - lubridate::period(preview_pdf_list[[i]]$`on-homepage-from`)
      x$on_homepage_to <- notes_datetime + lubridate::period(preview_pdf_list[[i]]$`on-homepage-to`)
    }
  }
  x
}

notes_list <- notes_list |>
  purrr::map(\(x) add_preview_window(x, preview_pdf_list, timezone))

#=====================#
# find upcoming notes #
#=====================#

in_preview_window <- function(x, live_date) {
  if (live_date > x$on_homepage_from & live_date < x$on_homepage_to) {
    x
  } else {NULL}
}

notes_to_preview <- notes_list |>
  purrr::map(\(x) in_preview_window(x, live_date)) |>
  purrr::discard(is.null)

#=====================#
# render notes to pdf #
#=====================#

if (length(notes_to_preview) > 0) {
  notes_to_preview_href <- unlist(purrr::map(notes_to_preview, "href"))
  
  render_pdf <- function(x) {
    quarto::quarto_render(x, 
                          output_format = "pdf",
                          debug = TRUE)
  }
  
  purrr::walk(notes_to_preview_href, render_pdf)
  
  # quarto_render moves them to _site, where they'll
  # get deleted during project render. copy them
  # to on-deck dir, which is in the project site resources
  
  pdfs <- list.files("_site", "notes\\.pdf$", recursive = TRUE)
  from <- fs::path(paste0("_site/", pdfs))
  to <- fs::path(paste0("on-deck/", pdfs)) |>
    stringr::str_remove("\\/notes.pdf")
  fs::dir_create(to)
  fs::file_move(from, to)
}

#===============================#
# write preview-pdf-items.yml #
#===============================#

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

repath_href <- function(x) {
  out <- stringr::str_replace(x, ".qmd", ".pdf")
  paste0("on-deck/", out)
}

update_href <- function(x) {
  purrr::list_modify(x, href = repath_href(x$href))
}

reading_list <- notes_to_preview |>
  purrr::map(update_title) |>
  purrr::map(update_href)

# write file
yaml::write_yaml(reading_list, "assets/preview-pdf-items.yml")

cli::cli_alert_success("PDFs of {unlist(purrr::map(reading_list, 'title'))} now available on home page.")

