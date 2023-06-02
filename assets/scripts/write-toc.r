# read in course settings
course_settings <- yaml::read_yaml("_course-settings.yml")

# load utility function
get_notes <- function(x) {
  is_notes <- purrr::map_lgl(x$contents, ~ stringr::str_ends(.x$href, "notes.qmd"))
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

# add sidebar options
toc_yaml <- list(website = list(sidebar = list(list(title = "Notes",
                                                    style = "floating",
                                                    align = "left",
                                                    "collapse-level" = 1L,
                                                    contents = notes_menu))))

# write file
ymlthis::use_yml_file(toc_yaml, "_quarto-toc.yml")

cli::cli_alert_success("Table of contents has been updated using the schedule of the notes in _course-settings.yml.")
