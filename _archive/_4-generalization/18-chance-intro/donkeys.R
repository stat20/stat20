#' Donkey measurements
#'
#' A dataset of donkey sizes and weights collected in Kenya 2010, 
#' on behalf of The Donkey Sanctuary.
#'
#' @details
#' The variables are:
#'
#' \itemize{
#' \item BCS. Body condition score: an ordinal scale 
#' running from 1 (emaciated) to 5 (obese) in steps of 0.5
#' \item Age. Age in intervals: <2, 2-5, etc
#' \item Sex. Sex: stallion, gelding, female
#' \item Length. Length in cm
#' \item Girth. Girth in cm
#' \item Height. Height in cm
#' \item Weight. Weight in kg
#' \item WeightAlt. Reweights for a subset
#' }
#'
#' Details of these measurements are available in the paper cited below. 
#' \code{BCS}, \code{Age} and \code{Sex} are represented as unordered factors.  The \code{WeightAlt} variable was used to check the accuracy of the weighing process, and may be deleted.
#'
#' @references
#'
#' K. Milner and J.C. Rougier, 2014, 
#' How to weigh a donkey in the Kenyan countryside, 
#' Signifiance Magazine, volume 11 issue 4, pages 40-43, 
#' \href{http://dx.doi.org/10.1111/j.1740-9713.2014.00768.x}{DOI:10.1111/j.1740-9713.2014.00768.x}.
#'
#' A BibTeX entry for this paper is available using the command 
#' \code{citation("paranomo")}.
#'
#' The Donkey Sanctuary, registered UK charity number 264818, \url{http://www.thedonkeysanctuary.org.uk/}
#'
#' @docType data
#' @keywords datasets
#' @format A data frame with 544 rows and 8 variables
#' @name donkeys
#' @examples
#' head(donkeys)

NULL
