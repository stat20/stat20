# install.packages("ymlthis")
# there are two decent packages to work with yaml: yaml
# and ymlthis. yaml has a reader
# but the writer uses YAML 1.1. ymlthis doesn't have
# a reader but at least writes in a spec more similar to
# quarto (e.g. uses true instead of yes). ymlthis has
# far more dependencies (including yaml).

schedule <- yaml::read_yaml("_schedule.yml")

# Reduce to data frame of files in the future
df <- as.data.frame(do.call(rbind, schedule$notes))
df$scheduled_date <- strptime(df$date, format = "%m/%d/%y", tz="America/Los_Angeles")
current_datetime <- .POSIXct(Sys.time(), "America/Los_Angeles")
future_df <- subset(df, scheduled_date > current_datetime)

# Read in base _quarto.yml and append the ignored
# files to the render key.
quarto_live <- yaml::read_yaml("_quarto.yml")
ignored_docs <- paste0("!", unlist(future_df$href))
quarto_live$project$render <- c("*.qmd", ignored_docs)

ymlthis::use_yml_file(quarto_live, "_quarto-live.yml")

# a riff on the following code might work in correcting
# the yaml output so that ymlthis isn't necessary
# yaml::write_yaml(quarto_live, "_quarto-live.yml", 
#                  handlers=list(logical = function(x) {
#                    if (x == "yes") {
#                      result <- "true"
#                      # class(result) <- "verbatim"
#                      return(result)
#                    }
#                  }))