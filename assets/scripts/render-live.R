live_as_of = "02/28/23"
# live_as_of = Sys.time()
tz = "America/Los_Angeles"

# ================== #
# propagate dates    #
# ================== #

source("assets/scripts/propagate-dates.r")


# ================== #
# ignore future docs #
# ================== #

# load utility function
is_not_live <- function(x, live_date, tz) {
  if(!exists("date", where = x)) {stop("Item in schedule lacks date field.")}
  file_date <- lubridate::mdy(x$date, tz = tz)
  
  if (file_date > live_date && exists("href", x)) {x$href} else {NA}
}

# read in course settings
course_settings <- yaml::read_yaml("_course-settings.yml")

# collect list of all materials
materials_list <- purrr::map(course_settings$schedule, "materials") |>
  purrr::list_flatten()

# extract vector of materials to be ignored
live_date <- if (is.character(live_as_of)) {
  lubridate::mdy(live_as_of, tz = tz)
} else {
  lubridate::with_tz(Sys.time(), tz = tz) 
}

filepaths_in_future <- purrr::map_chr(materials_list, 
                                      is_not_live, 
                                      live_date = live_date,
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

file.rename(from = dirs_in_future, # comment out directory
            to   = dirs_ignored)

if (length(dirs_in_future > 0)) {
  cli::cli_alert_success("The following files have publish dates after {live_date} therefore be ignored: {.path {dirs_in_future}}")
} else {
  cli::cli_alert_info("All files have published dates in the past. No files will be ignored.")
}


# ================== #
# write new toc file #
# ================== #

source("assets/scripts/write-toc.r")

# ================== #
# render website     #
# ================== #
cli::cli_alert_info("Rendering website...")
quarto::quarto_render(as_job = FALSE)



# =================== #
# unignore future docs
# =================== #

# reverse order of arguments to function for part 1 of this script

file.rename(from = dirs_ignored,
            to   = dirs_in_future)

cli::cli_alert_success("The previously ignored files have been reset to their original filenames.")
cli::cli_alert_success("The website as of {live_date} has been rendered!")
