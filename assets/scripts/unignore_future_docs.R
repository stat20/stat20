# Read in schedule data
x <- yaml::read_yaml("_schedule.yml")

# reverse filename changes to keep local dirs clean
unignore_future <- function(x) {
  if (strptime(x$date, "%m/%d/%y") > Sys.time()) {
    filenames_before <- grep(x$filedir,
                             list.dirs(full.names = FALSE),
                             value = TRUE)
    
    filenames_after <- gsub(x$filedir,
                            paste0("_", x$filedir),
                            filenames_before)
    
    file.rename(from = filenames_after,
                to   = filenames_before)
  }
}

lapply(x$notes, unignore_future)
lapply(x$labs, unignore_future)
