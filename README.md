# Iter8 #

Iter8 is a tool for pointing stories as part of an agile development cycle. Users connect and vote on how long it will take to complete stories. When all users have voted, a results screen shows the vote distribution, plus average and median point values.

![Screenshot of users connected to an Iter8 server](https://github.com/ryangreenberg/iter8/raw/master/assets/voting_preview.png)

![Screenshot of Iter8 voting results](https://github.com/ryangreenberg/iter8/raw/master/assets/results_preview.png)

## Installation ##

Iter8 is packaged as an npm module. You can either install it using npm, or download the source and run it directly from the application's directory.

### Installation using npm ###

    npm install -g git+https://github.com/ryangreenberg/iter8.git


### Run from source ###

    git clone git://github.com/ryangreenberg/iter8.git

## Usage ##
You can start the server with `iter8` if you installed using npm, or by running `./bin/iter8.js` in the source directory. Once you've started the server, you can connect to your instance of Iter8 at http://localhost:8080 (users on other machines will need to use your actual IP address).

Supply the `--help` flag for online help with command-line arguments:

    iter8 --help

    Usage: iter8 [options]

    Options:

      -h, --help         output usage information
      -V, --version      output the version number
      -p, --port <port>  server port [8080]

By default, Iter8 starts on port 8080. Use `-p` or `--port` to use a different port.

## Integration with Pivotal Tracker ##

If you want to automatically pull the latest unpointed stories from an installation of [Pivotal Tracker](https://www.pivotaltracker.com), create a credentials file that contains (by default, a file named `.pivotal_tracker.json`). This file should have a username, password, and projectId in JSON format:

    {
      "username": "alicesmith",
      "password": "p4ssw0rd",
      "projectId": "425000"
    }