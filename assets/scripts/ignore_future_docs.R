# Read in schedule data
x <- yaml::read_yaml("_schedule.yml")

# Change path of docs to be published in the future so that
# they're prepended with _ to have them ignored during render
# See https://quarto.org/docs/websites/index.html#render-targets

# todo: remove ".quarto", "_site", "_freeze" for speed

ignore_future <- function(x) {
  if (strptime(x$date, "%m/%d/%y") > Sys.time()) {
    
    filenames_before <- grep(x$filedir, 
                             list.dirs(full.names = FALSE), 
                             value = TRUE)

    filenames_after <- gsub(x$filedir, 
                            paste0("_", x$filedir),
                            filenames_before)
    
    file.rename(from = filenames_before,
                to   = filenames_after)
  }
}

lapply(x$notes, ignore_future)
lapply(x$labs, ignore_future)


# code alternate approach where _schedule.yml doesn't have file numbers
# pattern <- paste0("\\d\\d-", x$filedir)
# # extract the full dir name (with it's two-digit number)
# # this uses the first filename only, assuming they all use the same number
# # this is very brittle!
# full_dir_name <- regmatches(filenames_before[1], 
#                             regexpr(pattern, filenames_before[1]))
