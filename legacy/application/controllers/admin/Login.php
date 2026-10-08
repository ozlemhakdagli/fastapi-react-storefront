<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Login extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		
		$this->load->library("session");
		$this->load->helper('url');
		$this->load->library('form_validation');
		$this->load->model("Admin_Model");
		$this->load->database();
		
	} 

	public function index()
	{
		$this->load->view('admin/login_formu');
	
	}
	public function login_ol()
	{	
	
		$email = $this->input->post('email',TRUE);
		$sifre = $this->input->post('password',TRUE);
		// zararlı kodlardan temizleme
		$email = $this->security->xss_clean($email);
		$sifre = $this->security->xss_clean($sifre);
	
		
		$result = $this->Admin_Model->login($email,$sifre);
		
			if($result)
				{
					
					$session_array = array(
					'id' => $result[0]->ID,
					'yetki' =>$result[0]->yetki,
					'email' =>$result[0]->email,
					'adsoy'=>$result[0]->adiSoyadi,
					'resim' =>$result[0]->resim,
					'tarih' =>$result[0]->tarih
					);
				
					$this->session->set_userdata('oturum_data', $session_array);
					
					redirect(base_url().'admin/home/');
					
				}
			else
				{
					$this->session->set_flashdata("login_hata", "Geçersiz Email yada şifre");
					$this->load->view('admin/login_formu');
		
				}
		
		
	}
	public function log_out()
	{
		$this->session->unset_userdata('oturum_data');
		$this->session->sess_destroy();
		redirect(base_url().'admin/login');
	}
	
}
	