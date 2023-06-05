live_as_of = "02/01/23"
tz = "America/Los_Angeles"

# load utility function
is_not_live <- function(x, live_as_of, tz) {
  file_date <- lubridate::mdy(x$date, tz = tz)
  
  live_date <- if (is.character(live_as_of)) {
    lubridate::mdy(live_as_of, tz = tz)
  } else {
    lubridate::with_tz(Sys.time(), tz = tz) 
  }
  
  if (file_date > live_date) {x$href} else {NA}
}


# =================== #
# unignore future docs
# =================== #

# read in course settings
course_settings <- yaml::read_yaml("_course-settings.yml")

# collect list of all materials
materials_list <- purrr::map(course_settings$schedule, "materials") |>
  purrr::list_flatten()

# extract vector of materials to be ignored
filepaths_in_future <- purrr::map_chr(materials_list, 
                                      is_not_live, 
                                      live_as_of = live_as_of,
                                      tz = tz) |>
  purrr::discard(is.na)

# change paths
dirs_in_future <- stringr::str_extract(filepaths_in_future,
                                       "^(.*/).*?$", group = 1)
dirs_to_ignore <- stringr::str_extract(filepaths_in_future,
                                       "^.*/([^/]+)/[^/]+$", group = 1)
dirs_ignored <- paste0("_", dirs_to_ignore)
names(dirs_ignored) <- dirs_to_ignore

dirs_ignored <- stringr::str_replace_all(dirs_in_future,
                                         dirs_ignored)

file.rename(from = dirs_ignored, # comment out directory
            to   = dirs_in_future)