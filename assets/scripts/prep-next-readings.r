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

is_not_live <- function(x, live_date, timezone, buffer) { # load utility function
  if(!exists("date", where = x)) {stop("Item in schedule lacks date field.")}
  file_date <- lubridate::mdy(x$date, tz = timezone)
  
  if (file_date > (live_date - buffer)) {x} else {NULL}
}

#buffer = lubridate::days(2)
buffer = 0
next_notes <- purrr::map(notes_list, 
                         is_not_live, 
                         live_date = live_date,
                         timezone = timezone,
                         buffer = buffer) |>
  purrr::discard(is.null) |>
  head(n = 2)


#==============================#
# decide which notes to render #
#==============================#

# read in render day/times
n1_release <- course_settings$`auto-publish`$`notes-1-release` |>
  stringr::str_split_fixed(",", n = 2)
n1_day <- n1_release[1] |>
  stringr::str_trim()
n1_time <- n1_release[2] |>
  stringr::str_trim() |>
  stringr::str_split_fixed(":", n = 2)

n2_release <- course_settings$`auto-publish`$`notes-2-release` |>
  stringr::str_split_fixed(",", n = 2)
n2_day <- n2_release[1] |>
  stringr::str_trim()
n2_time <- n2_release[2] |>
  stringr::str_trim() |>
  stringr::str_split_fixed(":", n = 2)

# determine which notes are within the release window
next_notes_date <- purrr::map(next_notes, "date") |>
  unlist() |>
  lubridate::mdy()

notes_1_date <- min(next_notes_date)
notes_1_release_date <- notes_1_date
lubridate::wday(notes_1_release_date) <- n1_day
if (notes_1_release_date > notes_1_date) {
  notes_1_release_date <- notes_1_release_date - lubridate::weeks(1)
}
lubridate::hour(notes_1_release_date) <- as.integer(n1_time[1])
lubridate::second(notes_1_release_date) <- as.integer(n1_time[2])

notes_2_date <- max(next_notes_date)
notes_2_release_date <- notes_2_date
lubridate::wday(notes_2_release_date) <- n2_day
if (notes_2_release_date > notes_2_date) {
  notes_2_release_date <- notes_2_release_date - lubridate::weeks(1)
}
lubridate::hour(notes_2_release_date) <- as.integer(n2_time[1])
lubridate::second(notes_2_release_date) <- as.integer(n2_time[2])

# check if it is past the release date
is_past_release <- c(notes_1_release_date < live_date,
                     notes_2_release_date < live_date)

notes_to_release <- next_notes[is_past_release]

#=====================#
# render notes to pdf #
#=====================#

if (length(notes_to_release) > 0) {
  notes_to_release_href <- unlist(purrr::map(notes_to_release, "href"))
  
  render_pdf <- function(x) {
    quarto::quarto_render(x, 
                          output_format = "pdf",
                          debug = TRUE)
  }
  
  purrr::walk(notes_to_release_href, render_pdf)
  
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

repath_href <- function(x) {
  out <- stringr::str_replace(x, ".qmd", ".pdf")
  paste0("on-deck/", out)
}

update_href <- function(x) {
  purrr::list_modify(x, href = repath_href(x$href))
}

reading_list <- notes_to_release |>
  purrr::map(update_title) |>
  purrr::map(update_href)

# write file
yaml::write_yaml(reading_list, "assets/items.yml")

cli::cli_alert_success("PDFs of {unlist(purrr::map(reading_list, 'title'))} now available on home page.")

