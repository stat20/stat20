# A script to read in data with document publishing dates and
# write it to a small metadata file to be included in that document

# read in course settings
course_settings <- yaml::read_yaml("_course-settings.yml")

# load utility function
write_meta_file <- function(x) {
  meta_as_str <- paste0("---\ndate: ", 
                        x$date,
                        "\n---\n")
  
  # put the meta file in images/tmp/ relative to materials qmd
  tmp_dir <- paste0(gsub("^(.*/)[^/]+$", "\\1", x$href), "images/tmp")
  dir.create(tmp_dir, showWarnings = FALSE)
  writeLines(text = meta_as_str, con = paste0(tmp_dir, "/_date-meta.md"))
}

# collect list of all materials with links
href_list <- purrr::map(course_settings$schedule, "materials") |>
  purrr::list_flatten() |>
  purrr::keep(function(x) "href" %in% names(x))

# write meta file for all materials  
purrr::walk(href_list, write_meta_file)

cli::cli_alert_success("Dates have been propagated from _course-settings to the metadata of {length(href_list)} files.")

# temporary debug
ip = as.data.frame(installed.packages()[,c(1,3:4)])
ip = ip[is.na(ip$Priority),1:2,drop=FALSE]
cli::cli_alert_success("Packages: {ip}")
