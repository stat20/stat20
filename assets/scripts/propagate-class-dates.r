# read in schedule
schedule <- yaml::read_yaml("_schedule.yml")

# map write_meta_file over all date fields

date <- 


contents_as_str <- paste0("---\ndate: ", 
                          x$date,
                          "\n---\n")

file_conn <- file(paste0("output.md"))
writeLines(contents_as_str, file_conn)
close(file_conn)

write_meta_yml <- function() {
  
}