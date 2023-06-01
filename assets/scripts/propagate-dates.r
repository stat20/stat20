# read in schedule
schedule <- yaml::read_yaml("_quarto-schedule.yml")

# map write_meta_file over all date fields

library(tidyverse)
notes_and_sections <- schedule$website$sidebar[[1]]$contents[-1] |>
  purrr::list_flatten() |>
  purrr::list_flatten()

notes_list <- notes_and_sections[names(notes_and_sections) != "section"]

map(notes_list, write_meta_yml)

write_meta_yml <- function(x) {
  # prepare contents of file
  contents_as_str <- paste0("---\ndate: ", 
                            x$date,
                            "\n---\n")
  
  # write to file at appropriate path
  tmp_dir <- stringr::str_replace(x$href, "notes.qmd", "images/tmp")
  dir.create(tmp_dir, showWarnings = FALSE)
  file_conn <- file(paste0(tmp_dir, "/_date-meta.md"))
  writeLines(contents_as_str, file_conn)
  close(file_conn)
}
