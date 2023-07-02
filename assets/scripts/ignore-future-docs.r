
# read in course settings
course_settings <- yaml::read_yaml("_course-settings.yml")

# extract auto-publish parameters
timezone <- course_settings$`auto-publish`$timezone
live_as_of <- course_settings$`auto-publish`$`live-as-of`

# collect list of all materials
materials_list <- purrr::map(course_settings$schedule, "materials") |>
  purrr::list_flatten()

# extract vector of materials to be ignored
live_date <- if (live_as_of == "Sys.time()") {
  lubridate::with_tz(time = eval(parse(text = live_as_of)), 
                     tz = timezone) 
} else {
  lubridate::mdy(live_as_of, tz = timezone)
}

is_not_live <- function(x, live_date, timezone) { # load utility function
  if(!exists("date", where = x)) {stop("Item in schedule lacks date field.")}
  file_date <- lubridate::mdy(x$date, tz = timezone)
  
  if (file_date > live_date && exists("href", x)) {x$href} else {NA}
}

filepaths_in_future <- purrr::map_chr(materials_list, 
                                      is_not_live, 
                                      live_date = live_date,
                                      timezone = timezone) |>
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

file.rename(from = dirs_in_future, # comment out directory
            to   = dirs_ignored)

if (length(dirs_in_future > 0)) {
  cli::cli_alert_success("The following files have publish dates after {live_date} therefore be ignored: {.path {dirs_in_future}}")
} else {
  cli::cli_alert_info("All files have published dates in the past. No files will be ignored.")
}
