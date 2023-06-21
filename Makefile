userid := $(shell id -u)
groupid := $(shell id -g)
uname := $(shell uname)
ifeq ($(uname),Darwin)
	ssh_auth_sock_source = /run/host-services/ssh-auth.sock
	ssh_auth_sock_target = /home/rstudio/.ssh-auth.sock
else
	ssh_auth_sock_source = ${SSH_AUTH_SOCK}
	ssh_auth_sock_target = ${SSH_AUTH_SOCK}
endif

.PHONY: down ps pull stop up

down ps pull stop up: .env
	docker compose $@

.env:
	echo USERID=$(userid) >> $@
	echo GROUPID=$(groupid) >> $@
	echo SSH_AUTH_SOCK_SOURCE=$(ssh_auth_sock_source) >> $@
	echo SSH_AUTH_SOCK_TARGET=$(ssh_auth_sock_target) >> $@
	echo SSH_AUTH_SOCK=$(ssh_auth_sock_target) >> $@

clean:
	rm -f .env
