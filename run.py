#!/usr/bin/env python
# this entire thing is a hack
DEFAULT_PORT = 9090

from twisted.scripts.twistd import run
from optparse import OptionParser
import sys, os

def run_twistd(args1=None, args2=None):
  args = [sys.argv[0]]
  if args1 is not None:
    args.extend(args1)
  args.append("qwebirc")
  if args2 is not None:
    args.extend(args2)
  sys.argv = args
  run()
  
def help_reactors(*args):
  run_twistd(["--help-reactors"])
  sys.exit(1)

DEFAULT_REACTOR = "select" if os.name == "nt" else "poll"  

parser = OptionParser()
parser.add_option("-n", "--no-daemon", help="Don't run in the background.", action="store_false", dest="daemonise", default=True)
parser.add_option("--help-reactors", help="Display a list of reactor names.", action="callback", callback=help_reactors)
parser.add_option("-b", "--debug", help="Run in the Python Debugger.", action="store_true", dest="debug", default=False)
parser.add_option("-t", "--tracebacks", help="Display tracebacks in error pages (this reveals a LOT of information, do NOT use in production!)", action="store_true", dest="tracebacks", default=False)
parser.add_option("-r", "--reactor", help="Which reactor to use (see --help-reactors for a list).", dest="reactor", default=DEFAULT_REACTOR)
parser.add_option("-p", "--port", help="Port to start the server on.", type="int", dest="port", default=DEFAULT_PORT)
parser.add_option("-l", "--logfile", help="Path to twisted log file.", dest="logfile")
parser.add_option("-c", "--clf", help="Path to web CLF (Combined Log Format) log file.", dest="clogfile")
(options, args) = parser.parse_args()

args1, args2 = [], []

if not options.daemonise:
  args1.append("-n")
if options.debug:
  args1.append("-b")
args1+=["--reactor", options.reactor]
if options.logfile:
  args+=["--logfile", options.logfile]

args2+=["--port", options.port]
if not options.tracebacks:
  args2.append("-n")
if options.clogfile:
  args2+=["--logfile", options.clogfile]

run_twistd(args1, args2)
