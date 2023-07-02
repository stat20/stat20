
# ================== #
# propagate dates    #
# ================== #

source("assets/scripts/propagate-dates.r")


# ================== #
# ignore future docs #
# ================== #

source("assets/scripts/ignore-future-docs.r")


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
