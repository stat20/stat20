# Read in schedule data
x <- yaml::read_yaml("_schedule.yml")

# Change path of docs to be published in the future so that
# they're prepended with _ to have them ignored during render
# See https://quarto.org/docs/websites/index.html#render-targets

# future improvement: use list.files and pattern match to directory in question

ignore_future <- function(x) {
  if (strptime(x$date, "%m/%d/%y") > Sys.time()) {
    filenames_before <- grep(x$filedir, 
                             list.dirs(full.names = FALSE), 
                             value = TRUE)
    # remove ".quarto", "_site", "_freeze"
    filenames_after <- gsub(x$filedir, 
                            paste0("_", x$filedir),
                            filenames_before)
    file.rename(from = filenames_before,
                to   = filenames_after)
  }
}

lapply(x$notes, ignore_future)
lapply(x$labs, ignore_future)
