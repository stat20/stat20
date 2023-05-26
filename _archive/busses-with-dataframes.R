library(tidyverse)

## When do buses arrive at the bus stop? ##
# ======================================= #

# Unit of observation: bus

# This sample comes from real data, but we could have simulated using a box
bus <- read_csv("https://www.dropbox.com/s/9h8q35d99l7z1mb/bus-CNorth-late.csv?dl=1") 

bus <- bus %>%
  mutate(sched_time = seq(from = 0, by = 12, length = n()),
         arr_time = sched_time + minutes_late) %>%
  arrange(arr_time)

ggplot(bus, aes(x = arr_time)) +
  geom_histogram()



## When do passengers arrive at the bus stop? ##
# ============================================ #

# Unit of observation: passenger

# This sample comes from a box but we could have used real data
passenger_box <- data.frame(arr_time = seq(from = 0, 
                                           to = 17196.40,
                                           by = .01))
passenger <- passenger_box %>%    
  slice_sample(n = 100000, replace = TRUE)

ggplot(passenger, aes(x = arr_time)) +
  geom_histogram()



## How long do passengers have to wait for a bus? ##
# ================================================ #

# this is a function of both passenger and bus arrival times
# so it needs to be a function of both data frames.

next_bus <- function(pass_arr, bus_arr) {
  next_bus_arr_time <- vector(mode = "numeric", length = length(pass_arr))
  for (i in 1:length(pass_arr)) {
    coming_busses <- bus_arr[bus_arr >= pass_arr[i]]
    next_bus_arr_time[i] <- min(coming_busses)
  }
  next_bus_arr_time
}

passenger <- passenger %>%
  mutate(next_bus_arr_time = next_bus(arr_time, bus$arr_time),
         wait_time = next_bus_arr_time - arr_time)

ggplot(passenger, aes(x = wait_time)) +
  geom_histogram()


#####################
### No random processes
#####################

library(tidyverse)

next_bus <- function(pass_arr, bus_arr) {
  next_bus_arr_time <- vector(mode = "numeric", length = length(pass_arr))
  for (i in 1:length(pass_arr)) {
    coming_busses <- bus_arr[bus_arr >= pass_arr[i]]
    next_bus_arr_time[i] <- min(coming_busses)
  }
  next_bus_arr_time
}

# Regularly spaced buses
bus_regular <- data.frame(arr_time = seq(from = 7, to = 12, by = .2)) # buses every 9 min

# Buses with a mix of short and long intervals
bus_mixed <- data.frame(arr_time = c(seq(from = 7, to = 9, by = .1), # buses every 6 min during rush hour
                                     seq(from = 9.25, to = 12, by = .25))) # buses every 15 min otherwise

# Let's use 100000 perfectly spaced passengers
passenger <- data.frame(arr_time = seq(from = 7, to = 12, length = 1000))

passenger <- passenger %>%
  mutate(regular_next_bus = next_bus(arr_time, bus_regular$arr_time),
         regular_wait_time = regular_next_bus - arr_time,
         mixed_next_bus = next_bus(arr_time, bus_mixed$arr_time),
         mixed_wait_time = mixed_next_bus - arr_time)


# Regularly spaced buses
mean(diff(bus_regular$arr_time)) / 2 # naive estimate of passenger waiting time
passenger %>% 
  summarize(mean(regular_wait_time)) # true passenger waiting time

# Mixed buses
mean(diff(bus_mixed$arr_time)) / 2 # naive estimate of passenger waiting time
passenger %>% 
  summarize(mean(mixed_wait_time)) # true passenger waiting time


