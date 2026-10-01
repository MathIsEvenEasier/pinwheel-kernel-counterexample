import CertificateData
set_option maxRecDepth 100000
set_option maxHeartbeats 0
namespace Pinwheel.Certificate
theorem checked_t2681 : checkTree 35 cert t2681 = true := by decide +kernel
end Pinwheel.Certificate
