# Read in schedule data
x <- yaml::read_yaml("_schedule.yml")

# Change path of docs to be published in the future so that
# they're prepended with _ to have them ignored during render
# See https://quarto.org/docs/websites/index.html#render-targets

# For notes-to-be published, add either _links-to-materials.qmd 
# or _links-to-materials-blank.qmd in the directory of unignored 
# notes depending on whether the class materials release
# date has passed.

# todo: remove ".quarto", "_site", "_freeze" for speed

ignore_future_notes <- function(x, notes_offset = 0, cm_offset = 0) {
  
  current_datetime <- .POSIXct(Sys.time(), "America/Los_Angeles")
  schedule_datetime <- strptime(x$date, format = "%m/%d/%y", 
                              tz="America/Los_Angeles")
  
  filenames_before <- grep(pattern = paste0("^(?!(\\.quarto|_freeze|_site)).*", 
                                            x$filedir, 
                                            ".*$"),
                           list.dirs(full.names = FALSE), 
                           value = TRUE,
                           perl = TRUE)
  
  if ( schedule_datetime + notes_offset > current_datetime ) { # they're in the future

    filenames_after <- gsub(x$filedir, 
                            paste0("_", x$filedir),
                            filenames_before)
    
    file.rename(from = filenames_before, # comment out directory
                to   = filenames_after)
    
  } else { # if they're ready to publish don't comment-out but..
    
    shortest_path <- which.min(nchar(filenames_before))
    dest <- paste0(filenames_before[shortest_path],
                   "/images/_links-to-materials.qmd")
    
    if ( schedule_datetime + cm_offset > current_datetime ) {
      # if it's not yet the day of class
      # blank out the _link-to-materials.qmd include file
      file.copy(from = "assets/includes/_links-to-materials-blank.qmd",
                to = dest, overwrite = TRUE)
    }
  }
}

# Same as previous function but without the class materials component

ignore_future_labs <- function(x, labs_offset = 0) {
  
  current_datetime <- .POSIXct(Sys.time(), "America/Los_Angeles")
  schedule_datetime <- strptime(x$date, format = "%m/%d/%y", 
                                tz="America/Los_Angeles")
  
  if ( schedule_datetime + labs_offset > current_datetime ) {
    
    filenames_before <- grep(pattern = paste0("^(?!(\\.quarto|_freeze|_site)).*", 
                                              x$filedir, 
                                              ".*$"),
                             list.dirs(full.names = FALSE), 
                             value = TRUE, perl = TRUE)
    
    filenames_after <- gsub(x$filedir, 
                            paste0("_", x$filedir),
                            filenames_before)
    
    file.rename(from = filenames_before,
                to   = filenames_after)
    
  }
}

lapply(x$notes, 
       ignore_future_notes,
       notes_offset = x$`release-schedule`$`notes-offset`,
       cm_offset = x$`release-schedule`$`class-materials-offset`)

lapply(x$labs,
       ignore_future_labs,
       labs_offset = x$`release-schedule`$`labs-offset`)
