# settable parameters
# can also take format: live_as_of = "04/01/23"
#live_as_of = Sys.time()
live_as_of = "02/01/23"
tz = "America/Los_Angeles"

# load utility function
is_not_live <- function(x, live_as_of = Sys.time(), tz = "America/Los_Angeles") {
  file_date <- lubridate::mdy(x$date, tz = tz)
  
  live_date <- if (is.character(live_as_of)) {
    lubridate::mdy(live_as_of, tz = tz)
  } else {
    lubridate::with_tz(Sys.time(), tz = tz) 
  }
  
  if (file_date > live_date) {x$href} else {NA}
}

# read in course settings
course_settings <- yaml::read_yaml("_course-settings.yml")

# collect list of all materials
materials_list <- purrr::map(course_settings$schedule, "materials") |>
  purrr::list_flatten()

# extract vector of materials to be ignored during render
ignored_docs <- purrr::map_chr(materials_list, 
                               is_not_live, 
                               live_as_of = live_as_of) |>
  purrr::discard(is.na) |>
  paste0("!", ... = _) |>
  append("*.qmd", 0)

# write render targets into new quarto file
quarto_live <- list()
quarto_live$project$`output-dir` <- "_site-live"
quarto_live$project$render <- ignored_docs

yaml::write_yaml(quarto_live, "_quarto-live.yml")





# notes:

# there are two decent packages to work with yaml: yaml
# and ymlthis. yaml has a reader
# but the writer uses YAML 1.1. ymlthis doesn't have
# a reader but at least writes in a spec more similar to
# quarto (e.g. uses true instead of yes). ymlthis has
# far more dependencies (including yaml).
