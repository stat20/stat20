library(tidyverse)
set.seed(20)

color_points <- "lightsteelblue"

color_points <- "#003262"

# Load and process data
df <- read_csv("pop-lat-area.csv") %>%
    rename(lat = y) %>%
    filter(pop > 0)


# Plot 1: Bubble Chart
#---------------------

## Apply circle packing algorithm to find circle centers
library(packcircles)
df <- df %>%
    mutate(pop_avg = mean(pop))
packed_pop_avg <- circleProgressiveLayout(df$pop_avg, sizetype = 'area')
df_gg <- circleLayoutVertices(packed_pop_avg, npoints = 50)

## Make the plot
p1 <- ggplot(df_gg, aes(x = x, 
                        y = y, 
                        group = id)) + 
    geom_polygon(fill = color_points) +
    theme_void() + 
    theme(legend.position = "none") +
    coord_equal()

ggsave("p1.svg", p1, device = "svg") 


# Plot 2: Bubble Chart with pop
#---------------------

## Apply circle packing algorithm to find circle centers
packed_pop <- circleProgressiveLayout(df$pop, sizetype = 'area')
df_gg <- circleLayoutVertices(packed_pop, npoints = 50)

## Make the plot
p2 <- ggplot(df_gg, aes(x = x, 
                        y = y, 
                        group = id)) + 
    geom_polygon(fill = color_points) +
    theme_void() + 
    theme(legend.position = "none") +
    coord_equal()
    
ggsave("p2.svg", p2, device = "svg")    


# Animated

df1 <- circleLayoutVertices(packed_pop_avg, npoints = 50) %>%
    mutate(plot_num = 1)
df2 <- circleLayoutVertices(packed_pop, npoints = 50) %>%
    mutate(plot_num = 2)

df <- bind_rows(df1, df2)

library(gganimate)

p <- ggplot(df, aes(x = x, 
                    y = y, 
                    group = id)) + 
    geom_polygon(fill = color_points) +
    theme_void() + 
    theme(legend.position = "none") +
    coord_equal() +
    transition_states(plot_num, wrap = FALSE) +
    ease_aes('cubic-in-out')

a <- animate(p, 
        renderer = gifski_renderer(loop = FALSE),
        nframes = 100,
        fps = 20,
        height = 7,
        width = 7, 
        unit = "in", 
        res = 150)

anim_save("anim.gif", a)

# Beeswarm

library(ggbeeswarm)

df %>%
    ggplot(aes(x = 1, 
               y = lat,
               size = pop)) +
    geom_beeswarm(priority = "random",
                  cex = .01)



