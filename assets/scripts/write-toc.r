# Produces an updated toc quarto profile file to provide sidebar
# navigation for the website that includes all non-ignored notes files

# read in course settings
course_settings <- yaml::read_yaml("_course-settings.yml")

# load utility functions
detect_notes <- function(x) {
  if (exists("href", where = x)) {
    stringr::str_ends(x$href, "notes.qmd")
  } else {
    FALSE
  }
}

get_notes <- function(x) {
  is_notes <- purrr::map_lgl(x$contents, detect_notes)
  x$contents[!is_notes] <- NULL
  x
}

# format notes menu
notes_menu <- course_settings$schedule |>
  # change to name of toc keys
  purrr::map(purrr::set_names, nm = c("section", "contents")) |>
  # keep only lecture notes
  purrr::map(get_notes) |>
  # add landing page
  append("notes.qmd", 0)

# add glossary
glossary <- list(list(section = "Glossary",
                 contents = list(list(href = "glossary-defs.qmd"),
                                 list(href = "glossary-fns.qmd"))))
notes_menu <- notes_menu |>
  append(glossary)

# add sidebar options
toc_yaml <- list(website = list(sidebar = list(list(title = "Notes",
                                                    style = "floating",
                                                    align = "left",
                                                    "collapse-level" = 2L,
                                                    contents = notes_menu))))

# write file
yaml::write_yaml(toc_yaml, "_quarto-toc.yml")

cli::cli_alert_success("Table of contents has been updated by writing a new {.path _quarto-toc.yml} using the schedule of notes in {.path _course-settings.yml}.")
