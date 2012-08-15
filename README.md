# nhttpsnoop: Trace Node.js HTTP server activity

Synopsis:

    usage: nhttpsnoop [-cglns] [-t argtype] [-o col,...] [-p pid,...]

nhttpsnoop traces Node.js HTTP client, server, and garbage collection activity.
By default, all requests for all Node.js HTTP servers on the system are traced,
and information about each one is displayed as it completes:

nhttpsnoop traces Node.js HTTP server activity.  By default, all requests from
all Node.js servers on the system are traced, and each one is displayed as it
completes:

    # nhttpsnoop
    TIME            PID PROBE     LATENCY METHOD PATH
    [  0.440283]  73160 server    1.264ms GET    /uter
    [  1.436516]  73160 server    1.475ms GET    /wendell
    [  1.436611]  73160 server    1.435ms GET    /allison
    [  1.436687]  73160 server    1.375ms GET    /uter

With -l, a record is emitted when requests are received as well in addition to
when the response is sent:

    # nhttpsnoop -l
    TIME            PID PROBE        LATENCY METHOD PATH
    [  0.814249]  73160 server ->          - GET    /allison
    [  0.814426]  73160 server <-    0.177ms GET    /allison
    [  3.201576]  73160 server ->          - GET    /wendell
    [  3.202105]  73160 server ->          - GET    /allison
    [  3.202607]  73160 server <-    1.030ms GET    /wendell
    [  3.202745]  73160 server <-    0.639ms GET    /allison

Besides server operations (shown by default, and also requested with "-s"), you
can trace client operations with "-c" and garbage collection operations with
"-g".  These can be combined:

    # nhttpsnoop -cgls
    TIME            PID PROBE        LATENCY METHOD PATH
    [  0.132371]  73160 client ->          - GET    /wendell
    [  0.133475]  73160 server ->          - GET    /wendell
    [  0.133887]  73160 server <-    0.411ms GET    /wendell
    [  0.134267]  73160 client <-    1.895ms GET    /wendell
    [  7.133776]  73160 gc     <-    0.831ms -      -

You can also select fields for display with -o, much like ps(1) and other
tools:

    # nhttpsnoop -otime,method,path
    TIME         METHOD PATH
    [  2.381936] GET    /wf_runners/869de259-5bdf-4efe
    [  2.965854] GET    /search/wf_jobs
    [  2.960546] GET    /agentprobes

See below for the list of columns available.

Finally, you can select individual processes to trace using -p, also like ps(1).


## Option summary

    -c            Trace HTTP client activity (request/response pairs).
                  See "Notes" below.

    -g            Trace garbage collections.

    -l            Display two lines, one each for the beginning and end of each
                  HTTP request.  For server requests, these correspond with
                  receiving the request and sending the response.  For client
                  requests, these correspond with sending the request and
                  receiving the response.

                  This is useful when you want to see how operations are
                  actually interleaved instead of just how long each one takes.

    -n            Don't actually run DTrace, but instead just print out the D
                  script that would be used.

    -o col,...    Display the specified columns instead of the default output.
                  Available columns include:

                latency         time in microseconds between the request being
                                received and the response being sent.

                method          Request's HTTP method

                path            Request's HTTP URL path
                                (excludes query parameters)

                pid             process identifier

                probe           indicates the type of event
                                ("client", "server", or "gc")

                raddr           Remote host's IPv4 address

                rport           Remote host's TCP port

                time            relative time of the event from when $nhs_arg0
                                started

                url             Request's full HTTP URL, including query parameters

                which           Indicates with an arrow whether this is an
                                incoming or outgoing request.

                  Some fields may not apply to all events.

    -p pid,...    Only trace the specified processes.

    -s            Trace HTTP server activity (request/response pairs).

    -t ARGTYPE    Specify which probe arguments to use, which must be one of
                  "translated" or "simple".  Translated arguments are more
                  extensible, more efficient, and the only reliable approach on
                  systems that support them.  Untranslated arguments are
                  required on OS X, which doesn't support USDT translators.
                  The default value is selected based on your system and you
                  should never need to override this.


## Selecting processes

"-p" is the only way to select processes, but you can use this with pgrep(1)
for more sophisticated selections:

    # nhttpsnoop -p "$(pgrep -f restify)"  # select only "restify" processes
    # nhttpsnoop -p "$(pgrep -z myzone)"   # select processes in zone "myzone"
    # nhttpsnoop -p "$(pgrep -u dap)"      # select processes with user "dap"

With "-p", all Node processes are actually traced, but only requests from the
selected processes are printed.

## Notes

This tool uses the Node.js DTrace provider and dtrace(1M).  You must have
permissions to run dtrace(1M) and use this provider.  It works on illumos-based
systems and OS X systems with builds of Node with [Node issue
3617](https://github.com/joyent/node/issues/3617) resolved.

Data for HTTP client requests is not reliable when multiple requests are issued
concurrently for the same remote server.  Unfortunately, there's no way to
reliably associate request and response pairs in this case.  As a result, some
records may be missing from the output, and others may have incorrect time and
latency information.

If you see an error like the following:

    dtrace: failed to compile script /var/tmp/nhttpsnoop.81961.d: line 20: failed to resolve translated type for args[1]
    nhttpsnoop: failed to invoke dtrace(1M)

then "dtrace" didn't find the expected Node translator file.  Node installs
this file into $PREFIX/lib/dtrace/node.d, but dtrace only knows about
/usr/lib/dtrace/node.d.  So if you have installed Node into a prefix other than
/usr, then you must specify this via DTRACE\_OPTS in your environment:

    # export DTRACE_OPTS='-L $PREFIX/lib/dtrace'

where `$PREFIX` is where you've installed Node (e.g., "/usr/local" or
"/opt/local").  nhttpsnoop passes DTRACE\_OPTS to "dtrace", which in this case
causes "dtrace" to look for the node.d translator file in the directory
specified by -L.  See the "-L" option in dtrace(1M) for details.

On older versions of illumos, you may see errors like this:

    # dtrace: error on enabled probe ID 34 (ID 67807: node6112:node:_ZN4node26DTRACE_HTTP_SERVER_REQUESTERKN2v89ArgumentsE:http-server-request): invalid kernel access in action #2 at DIF offset 348

This has been fixed in versions of SmartOS after 20120531T220306Z.  See "uname
-v" to see what release you're running.
