Prerequisites
=============
Install [Docker](https://www.docker.com/products/docker-desktop/).

If you are running on a computer with Apple Silicon (using a new "M" processor),
  - Update macOS to Venture 13 or newer.
  - Install Apple's Rosetta emulation by running `softwareupdate --install-rosetta`.
  - In Docker Desktop, enable Settings > Features in development > Use Rosetta for x86/amd64 emulation on Apple Silicon.

Checkout this repository into a new working directory.


Run the Container
=================
In a terminal window, change into the working directory and run `make up`. This initializes your environment by creating the file `.env`. It then runs `docker compose`.

When your environment changes, for example if you log out and back in, or if you manually copy your working directory to another platform, run `make clean` or manually delete the `.env` file. Then run `make up`.


Build a Custom Image (WIP)
==========================
The container is normally built automatically by a CI process on GitHub Actions. If you need to alter the image, for example if you want to locally test a new library addition, you can do the following:

x. Checkout the `https://github.com/stat20/stat20-docker` repository.
x. Make any changes
x. Run `docker build -t somename:sometag .`. If on an alternative hardware platform like Apple's ARM (modern Apple computers), you can run `docker build -t somename:sometag --platform linux/amd64 .`.
x. Create a new file names `docker-compose.override.yml` with the following contents:
```yaml
version: "3.8"
services:
  stat20:
    image: somename:sometag
```
