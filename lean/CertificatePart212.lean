import CertificateData
set_option maxRecDepth 100000
set_option maxHeartbeats 0
namespace Pinwheel.Certificate
theorem checked_t3402 : checkTree 35 cert t3402 = true := by decide +kernel
end Pinwheel.Certificate
