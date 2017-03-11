# nci ssh node

SSH node for [nci](https://github.com/node-ci/nci).

This plugin allows to execute build on remote host via ssh.

[![Build Status](https://travis-ci.org/node-ci/nci-ssh-node.svg?branch=master)](https://travis-ci.org/node-ci/nci-ssh-node)

## nci host requirements

This plugins requires only ssh client which should accessible as `ssh` command
for user from which nci was started.


## Remote host requirements

* running ssh server
* git client >= 1.9 (only for building git projects)
* mercurial client >= 2.8 (only for building mercurial projects)


## Installation

```sh
npm install nci-ssh-node
```


## Usage

Add this plugin to the `plugins` section at server config, configure specific
node by adding it to `nodes` section e.g.:

```json
    "plugins": [
        "nci-ssh-node"
    ],
    "nodes": [
        {
            "type": "ssh",
            "name": "localNetworkRemote",
            "usageStrategy": "maximum",
            "maxExecutorsCount": 3,
            "options": {
                "host": "192.168.0.1",
                "user": "ci",
                "identityFile": "/home/ci/.ssh/id_rsa_test",
                "baseDir": "/var/tmp/nci/data/projects"
            }
        }
    ],

```

After that `localNetworkRemote` node will be used for building projects 
according to `usageStrategy`. During build nci will run commands at 
`options.host` as `options.user` trying to authenticate using
`options.identityFile`. `options.baseDir` at `localNetworkRemote` will be used
as base for storing project workspaces.

For correct escaping inside your build steps please use double quotes for
command arguments e.g. use `echo "1 2 3"` not `echo '1 2 3'`.

Also note that it will be non-interactive ssh session, some linux distributions
comes with `~/.bashrc` which prevents it's loading in this case, e.g. default
`~/.bashrc` on ubuntu 14.04 contains:

```sh
# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac
```

So if you care about `~/.bashrc` been loaded for nci session please check it
out on remote host.
